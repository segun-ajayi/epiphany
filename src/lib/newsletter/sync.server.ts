import type { AdminUser } from "../auth/permissions.ts";
import { AdminError } from "../auth/permissions.ts";
import type { SqlDatabase } from "../db/sql.types.ts";
import {
  ProviderSyncError,
  getSubscriberStatusFromProvider,
  syncSubscriberWithProvider,
  type NewsletterProviderConfig,
} from "./providers.server.ts";
import type { DeliveryProvider, NewsletterSubscriber } from "./schemas.ts";

type ProviderName = Exclude<DeliveryProvider, "disabled">;

export async function getActiveNewsletterProvider(db: SqlDatabase) {
  const row = await db
    .prepare("SELECT active_provider FROM newsletter_delivery_settings WHERE id = 1")
    .first<{ active_provider: DeliveryProvider }>();
  return row?.active_provider ?? "disabled";
}

async function recordSync(
  db: SqlDatabase,
  provider: ProviderName,
  subscriber: NewsletterSubscriber,
  result: { externalId: string | null; remoteStatus: string } | null,
  error: string | null,
) {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO newsletter_provider_sync
        (subscriber_id, provider, external_id, remote_status, last_attempt_at, last_synced_at, last_error)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(subscriber_id, provider) DO UPDATE SET
         external_id = COALESCE(excluded.external_id, newsletter_provider_sync.external_id),
         remote_status = COALESCE(excluded.remote_status, newsletter_provider_sync.remote_status),
         last_attempt_at = excluded.last_attempt_at,
         last_synced_at = excluded.last_synced_at,
         last_error = excluded.last_error`,
    )
    .bind(
      subscriber.id,
      provider,
      result?.externalId ?? null,
      result?.remoteStatus ?? null,
      now,
      error ? null : now,
      error,
    )
    .run();
}

export async function syncOneNewsletterSubscriber(
  db: SqlDatabase,
  provider: ProviderName,
  config: NewsletterProviderConfig,
  subscriber: NewsletterSubscriber,
) {
  if (!config.availability[provider].configured)
    throw new AdminError(409, "provider_unconfigured", "Complete this provider's setup first.");
  const existing = await db
    .prepare(
      "SELECT external_id FROM newsletter_provider_sync WHERE subscriber_id = ? AND provider = ?",
    )
    .bind(subscriber.id, provider)
    .first<{ external_id: string | null }>();
  try {
    const result = await syncSubscriberWithProvider(
      provider,
      config.credentials,
      subscriber,
      existing?.external_id ?? null,
    );
    await recordSync(db, provider, subscriber, result, null);
    return { ok: true as const };
  } catch (error) {
    const message =
      error instanceof ProviderSyncError
        ? error.message
        : `${provider === "kit" ? "Kit" : "Sender"} synchronization failed.`;
    await recordSync(db, provider, subscriber, null, message);
    return { ok: false as const, error: message };
  }
}

export async function syncSubscriberToActiveProvider(
  db: SqlDatabase,
  config: NewsletterProviderConfig,
  subscriber: NewsletterSubscriber,
) {
  const provider = await getActiveNewsletterProvider(db);
  if (provider === "disabled") return { ok: true as const, skipped: true as const };
  if (!config.availability[provider].configured) {
    return {
      ok: false as const,
      error: `${provider === "kit" ? "Kit" : "Sender"} setup is incomplete; the local change was saved for a later retry.`,
    };
  }
  return syncOneNewsletterSubscriber(db, provider, config, subscriber);
}

export async function syncNewsletterBatch(
  db: SqlDatabase,
  config: NewsletterProviderConfig,
  limit = 25,
) {
  const provider = await getActiveNewsletterProvider(db);
  if (provider === "disabled")
    throw new AdminError(409, "delivery_disabled", "Choose a delivery provider before syncing.");
  if (!config.availability[provider].configured)
    throw new AdminError(409, "provider_unconfigured", "Complete this provider's setup first.");
  const rows = (
    await db
      .prepare(
        `SELECT s.id, s.email, s.name, s.status, s.consent_at, s.source, s.updated_at
         FROM newsletter_subscribers s
         LEFT JOIN newsletter_provider_sync p
           ON p.subscriber_id = s.id AND p.provider = ?
         WHERE p.last_synced_at IS NULL OR p.last_synced_at < s.updated_at OR p.last_error IS NOT NULL
         ORDER BY s.updated_at ASC
         LIMIT ?`,
      )
      .bind(provider, limit)
      .all<NewsletterSubscriber>()
  ).results;
  let succeeded = 0;
  let failed = 0;
  for (const subscriber of rows) {
    const result = await syncOneNewsletterSubscriber(db, provider, config, subscriber);
    if (result.ok) succeeded += 1;
    else failed += 1;
  }
  const pending = await db
    .prepare(
      `SELECT COUNT(*) AS n
       FROM newsletter_subscribers s
       LEFT JOIN newsletter_provider_sync p
         ON p.subscriber_id = s.id AND p.provider = ?
       WHERE p.last_synced_at IS NULL OR p.last_synced_at < s.updated_at OR p.last_error IS NOT NULL`,
    )
    .bind(provider)
    .first<{ n: number }>();
  return {
    ok: true as const,
    processed: rows.length,
    succeeded,
    failed,
    remaining: pending?.n ?? 0,
  };
}

async function recordReconciliation(
  db: SqlDatabase,
  provider: ProviderName,
  subscriber: NewsletterSubscriber,
  externalId: string | null,
  remoteStatus: string | null,
  error: string | null,
  acknowledgeLocalStatus = false,
) {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO newsletter_provider_sync
        (subscriber_id, provider, external_id, remote_status, last_attempt_at, last_synced_at,
         last_error, last_reconciled_at, last_reconcile_error)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
       ON CONFLICT(subscriber_id, provider) DO UPDATE SET
         external_id = COALESCE(excluded.external_id, newsletter_provider_sync.external_id),
         remote_status = COALESCE(excluded.remote_status, newsletter_provider_sync.remote_status),
         last_synced_at = COALESCE(excluded.last_synced_at, newsletter_provider_sync.last_synced_at),
         last_reconciled_at = excluded.last_reconciled_at,
         last_reconcile_error = excluded.last_reconcile_error`,
    )
    .bind(
      subscriber.id,
      provider,
      externalId,
      remoteStatus,
      now,
      acknowledgeLocalStatus ? now : null,
      now,
      error,
    )
    .run();
}

export async function reconcileNewsletterBatch(
  db: SqlDatabase,
  user: AdminUser,
  config: NewsletterProviderConfig,
  limit = 25,
  fetcher: typeof fetch = fetch,
  mode: "manual" | "automatic" = "manual",
) {
  if (user.role !== "administrator")
    throw new AdminError(403, "forbidden", "Only administrators may reconcile subscribers.");
  const provider = await getActiveNewsletterProvider(db);
  if (provider === "disabled")
    throw new AdminError(
      409,
      "delivery_disabled",
      "Choose a delivery provider before checking its status.",
    );
  if (!config.availability[provider].configured)
    throw new AdminError(409, "provider_unconfigured", "Complete this provider's setup first.");

  const rows = (
    await db
      .prepare(
        `SELECT s.id, s.email, s.name, s.status, s.consent_at, s.source, s.updated_at,
                p.external_id
         FROM newsletter_subscribers s
         LEFT JOIN newsletter_provider_sync p
           ON p.subscriber_id = s.id AND p.provider = ?
         WHERE s.status = 'subscribed'
         ORDER BY COALESCE(p.last_reconciled_at, '') ASC, s.updated_at ASC
         LIMIT ?`,
      )
      .bind(provider, limit)
      .all<NewsletterSubscriber & { external_id: string | null }>()
  ).results;

  let suppressed = 0;
  let unchanged = 0;
  let failed = 0;
  for (const row of rows) {
    const { external_id: externalId, ...subscriber } = row;
    try {
      const remote = await getSubscriberStatusFromProvider(
        provider,
        config.credentials,
        subscriber,
        externalId,
        fetcher,
      );
      if (remote.suppressed) {
        const now = new Date().toISOString();
        const result = await db.batch([
          db
            .prepare(
              `UPDATE newsletter_subscribers
               SET status = 'unsubscribed', updated_at = ?, unsubscribed_at = ?
               WHERE id = ? AND status = 'subscribed'`,
            )
            .bind(now, now, subscriber.id),
          db
            .prepare(
              `INSERT INTO audit_log
                (id, actor_id, action, content_type, record_id, summary, created_at)
               SELECT ?, ?, 'newsletter.reconcile', 'newsletter', ?, ?, ? WHERE changes() = 1`,
            )
            .bind(
              crypto.randomUUID(),
              user.id,
              subscriber.id,
              `${mode === "automatic" ? "Automatic provider check imported" : "Imported"} ${provider} suppression status: ${remote.remoteStatus}.`,
              now,
            ),
        ]);
        if (result[0].meta?.changes === 1) suppressed += 1;
        else unchanged += 1;
      } else {
        unchanged += 1;
      }
      await recordReconciliation(
        db,
        provider,
        subscriber,
        remote.externalId,
        remote.remoteStatus,
        null,
        remote.suppressed,
      );
    } catch (error) {
      failed += 1;
      const message =
        error instanceof ProviderSyncError
          ? error.message
          : `${provider === "kit" ? "Kit" : "Sender"} status check failed.`;
      await recordReconciliation(db, provider, subscriber, externalId, null, message);
    }
  }
  return { ok: true as const, processed: rows.length, suppressed, unchanged, failed };
}

export async function runAutomaticNewsletterReconciliation(
  db: SqlDatabase,
  config: NewsletterProviderConfig,
  limit = 25,
  fetcher: typeof fetch = fetch,
) {
  const settings = await db
    .prepare(
      `SELECT active_provider, updated_by, auto_reconcile_enabled
       FROM newsletter_delivery_settings WHERE id = 1`,
    )
    .first<{
      active_provider: DeliveryProvider;
      updated_by: string | null;
      auto_reconcile_enabled: number;
    }>();
  if (
    !settings ||
    settings.active_provider === "disabled" ||
    settings.auto_reconcile_enabled !== 1
  ) {
    return { ok: true as const, skipped: true as const, reason: "disabled" as const };
  }

  const now = new Date().toISOString();
  if (!settings.updated_by) {
    const message = "Automatic reconciliation has no approved audit owner.";
    await db
      .prepare(
        `UPDATE newsletter_delivery_settings
         SET last_auto_reconcile_at = ?, last_auto_reconcile_error = ? WHERE id = 1`,
      )
      .bind(now, message)
      .run();
    return { ok: false as const, skipped: true as const, reason: "missing_owner" as const };
  }

  try {
    const result = await reconcileNewsletterBatch(
      db,
      { id: settings.updated_by, email: "", role: "administrator" },
      config,
      limit,
      fetcher,
      "automatic",
    );
    const error =
      result.failed > 0 ? `${result.failed} subscriber status checks need attention.` : null;
    await db
      .prepare(
        `UPDATE newsletter_delivery_settings
         SET last_auto_reconcile_at = ?, last_auto_reconcile_error = ? WHERE id = 1`,
      )
      .bind(now, error)
      .run();
    return { ...result, automatic: true as const };
  } catch {
    const message = "Automatic provider reconciliation could not run.";
    await db
      .prepare(
        `UPDATE newsletter_delivery_settings
         SET last_auto_reconcile_at = ?, last_auto_reconcile_error = ? WHERE id = 1`,
      )
      .bind(now, message)
      .run();
    return { ok: false as const, automatic: true as const, error: message };
  }
}
