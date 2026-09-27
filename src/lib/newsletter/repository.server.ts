import type { AdminUser } from "../auth/permissions.ts";
import { AdminError } from "../auth/permissions.ts";
import type { SqlDatabase } from "../db/sql.types.ts";
import {
  NEWSLETTER_CONSENT_VERSION,
  newsletterSignupSchema,
  newsletterStatusSchema,
  deliveryProviderSchema,
  newsletterTemplateSchema,
  type DeliveryProvider,
  type NewsletterDelivery,
  type NewsletterCampaign,
  type NewsletterSubscriber,
} from "./schemas.ts";

function assertAdministrator(user: AdminUser) {
  if (user.role !== "administrator") {
    throw new AdminError(403, "forbidden", "Only administrators may view subscriber details.");
  }
}

export async function subscribeToNewsletter(db: SqlDatabase, input: unknown) {
  const signup = newsletterSignupSchema.parse(input);
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO newsletter_subscribers
        (id, email, name, status, consent_at, consent_version, source, created_at, updated_at, unsubscribed_at)
       VALUES (?, ?, ?, 'subscribed', ?, ?, 'homepage', ?, ?, NULL)
       ON CONFLICT(email) DO UPDATE SET
         name = CASE WHEN excluded.name != '' THEN excluded.name ELSE newsletter_subscribers.name END,
         status = 'subscribed',
         consent_at = excluded.consent_at,
         consent_version = excluded.consent_version,
         source = excluded.source,
         updated_at = excluded.updated_at,
         unsubscribed_at = NULL`,
    )
    .bind(crypto.randomUUID(), signup.email, signup.name, now, NEWSLETTER_CONSENT_VERSION, now, now)
    .run();
  const subscriber = await db
    .prepare(
      `SELECT id, email, name, status, consent_at, source, updated_at
       FROM newsletter_subscribers WHERE email = ?`,
    )
    .bind(signup.email)
    .first<NewsletterSubscriber>();
  if (!subscriber) throw new Error("Newsletter subscriber was not saved.");
  return { ok: true as const, subscriber };
}

export async function loadNewsletterSubscribers(
  db: SqlDatabase,
  user: AdminUser,
  page = 0,
  providers: NewsletterDelivery["providers"] = {
    kit: { configured: false },
    sender: { configured: false },
  },
) {
  assertAdministrator(user);
  const pageSize = 25;
  const [subscribers, totals, settings, campaigns, campaignTotals] = await db.batch([
    db
      .prepare(
        `SELECT id, email, name, status, consent_at, source, updated_at
         FROM newsletter_subscribers
         ORDER BY CASE status WHEN 'subscribed' THEN 0 ELSE 1 END, consent_at DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(pageSize, page * pageSize),
    db.prepare(
      `SELECT COUNT(*) AS total,
        SUM(CASE WHEN status = 'subscribed' THEN 1 ELSE 0 END) AS subscribed,
        SUM(CASE WHEN status = 'unsubscribed' THEN 1 ELSE 0 END) AS unsubscribed
       FROM newsletter_subscribers`,
    ),
    db.prepare(
      `SELECT active_provider, active_template, auto_reconcile_enabled, last_auto_reconcile_at,
              last_auto_reconcile_error, event_workflow_enabled, last_event_workflow_at,
              last_event_workflow_error
       FROM newsletter_delivery_settings WHERE id = 1`,
    ),
    db.prepare(
      `SELECT id, event_id, slug, template_id, subject, provider, status, attempts,
              send_after, last_attempt_at, last_error, sent_at, created_at
       FROM newsletter_campaigns
       ORDER BY created_at DESC LIMIT 20`,
    ),
    db.prepare(
      `SELECT
         SUM(CASE WHEN status IN ('queued', 'creating', 'draft', 'sending') THEN 1 ELSE 0 END) AS queued,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
       FROM newsletter_campaigns`,
    ),
  ]);
  const counts = totals.results[0] as {
    total: number;
    subscribed: number | null;
    unsubscribed: number | null;
  };
  const deliverySettings = settings.results[0] as
    | {
        active_provider?: DeliveryProvider;
        active_template?: NewsletterDelivery["activeTemplate"];
        auto_reconcile_enabled?: number;
        last_auto_reconcile_at?: string | null;
        last_auto_reconcile_error?: string | null;
        event_workflow_enabled?: number;
        last_event_workflow_at?: string | null;
        last_event_workflow_error?: string | null;
      }
    | undefined;
  const activeProvider = deliverySettings?.active_provider ?? "disabled";
  const workflowCounts = campaignTotals.results[0] as {
    queued: number | null;
    failed: number | null;
  };
  let sync = {
    synced: 0,
    pending: 0,
    errors: 0,
    lastAttemptAt: null as string | null,
    lastReconciledAt: null as string | null,
  };
  if (activeProvider !== "disabled") {
    const summary = await db
      .prepare(
        `SELECT
           SUM(CASE WHEN p.last_synced_at >= s.updated_at AND p.last_error IS NULL THEN 1 ELSE 0 END) AS synced,
           SUM(CASE WHEN p.last_synced_at IS NULL OR p.last_synced_at < s.updated_at THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN p.last_error IS NOT NULL THEN 1 ELSE 0 END) AS errors,
           MAX(p.last_attempt_at) AS last_attempt_at,
           MAX(p.last_reconciled_at) AS last_reconciled_at
         FROM newsletter_subscribers s
         LEFT JOIN newsletter_provider_sync p
           ON p.subscriber_id = s.id AND p.provider = ?`,
      )
      .bind(activeProvider)
      .first<{
        synced: number | null;
        pending: number | null;
        errors: number | null;
        last_attempt_at: string | null;
        last_reconciled_at: string | null;
      }>();
    sync = {
      synced: summary?.synced ?? 0,
      pending: summary?.pending ?? 0,
      errors: summary?.errors ?? 0,
      lastAttemptAt: summary?.last_attempt_at ?? null,
      lastReconciledAt: summary?.last_reconciled_at ?? null,
    };
  }
  return {
    subscribers: subscribers.results as NewsletterSubscriber[],
    totals: {
      total: counts.total,
      subscribed: counts.subscribed ?? 0,
      unsubscribed: counts.unsubscribed ?? 0,
    },
    page,
    pageSize,
    campaigns: campaigns.results.map((row) => {
      const campaign = row as {
        id: string;
        event_id: string;
        slug: string;
        template_id: NewsletterCampaign["templateId"];
        subject: string;
        provider: NewsletterCampaign["provider"];
        status: NewsletterCampaign["status"];
        attempts: number;
        send_after: string;
        last_attempt_at: string | null;
        last_error: string | null;
        sent_at: string | null;
        created_at: string;
      };
      return {
        id: campaign.id,
        eventId: campaign.event_id,
        slug: campaign.slug,
        templateId: campaign.template_id,
        subject: campaign.subject,
        provider: campaign.provider,
        status: campaign.status,
        attempts: campaign.attempts,
        sendAfter: campaign.send_after,
        lastAttemptAt: campaign.last_attempt_at,
        lastError: campaign.last_error,
        sentAt: campaign.sent_at,
        createdAt: campaign.created_at,
      } satisfies NewsletterCampaign;
    }),
    delivery: {
      activeProvider,
      activeTemplate: deliverySettings?.active_template ?? "heritage",
      providers,
      sync,
      automation: {
        enabled: (deliverySettings?.auto_reconcile_enabled ?? 1) === 1,
        schedule: "daily",
        lastRunAt: deliverySettings?.last_auto_reconcile_at ?? null,
        lastError: deliverySettings?.last_auto_reconcile_error ?? null,
      },
      workflow: {
        enabled: (deliverySettings?.event_workflow_enabled ?? 1) === 1,
        schedule: "every-five-minutes",
        queued: workflowCounts.queued ?? 0,
        failed: workflowCounts.failed ?? 0,
        lastRunAt: deliverySettings?.last_event_workflow_at ?? null,
        lastError: deliverySettings?.last_event_workflow_error ?? null,
      },
    } satisfies NewsletterDelivery,
  };
}

export async function setEventNewsletterWorkflow(
  db: SqlDatabase,
  user: AdminUser,
  enabled: unknown,
) {
  assertAdministrator(user);
  if (typeof enabled !== "boolean") {
    throw new AdminError(400, "validation", "Choose whether event newsletters are enabled.");
  }
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `UPDATE newsletter_delivery_settings
         SET event_workflow_enabled = ?, updated_at = ?, updated_by = ?
         WHERE id = 1 AND event_workflow_enabled != ?`,
      )
      .bind(Number(enabled), now, user.id, Number(enabled)),
    db
      .prepare(
        `INSERT INTO audit_log
          (id, actor_id, action, content_type, record_id, summary, created_at)
         SELECT ?, ?, 'newsletter.workflow', 'newsletter', 'event-published', ?, ?
         WHERE changes() = 1`,
      )
      .bind(
        crypto.randomUUID(),
        user.id,
        enabled
          ? "Enabled event publication newsletters."
          : "Paused event publication newsletters.",
        now,
      ),
  ]);
  return { ok: true as const, enabled };
}

export async function getActiveNewsletterTemplate(db: SqlDatabase) {
  const row = await db
    .prepare("SELECT active_template FROM newsletter_delivery_settings WHERE id = 1")
    .first<{ active_template: NewsletterDelivery["activeTemplate"] }>();
  return newsletterTemplateSchema.catch("heritage").parse(row?.active_template);
}

export async function setNewsletterTemplate(db: SqlDatabase, user: AdminUser, value: unknown) {
  assertAdministrator(user);
  const template = newsletterTemplateSchema.parse(value);
  const current = await getActiveNewsletterTemplate(db);
  if (current === template) return { ok: true as const, activeTemplate: template };
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `INSERT INTO newsletter_delivery_settings
          (id, active_provider, active_template, updated_at, updated_by,
           template_updated_at, template_updated_by)
         VALUES (1, 'disabled', ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           active_template = excluded.active_template,
           template_updated_at = excluded.template_updated_at,
           template_updated_by = excluded.template_updated_by`,
      )
      .bind(template, now, user.id, now, user.id),
    db
      .prepare(
        `INSERT INTO audit_log
          (id, actor_id, action, content_type, record_id, summary, created_at)
         VALUES (?, ?, 'newsletter.template', 'newsletter', 'welcome', ?, ?)`,
      )
      .bind(crypto.randomUUID(), user.id, `Selected ${template} newsletter design.`, now),
  ]);
  return { ok: true as const, activeTemplate: template };
}

export async function setNewsletterProvider(
  db: SqlDatabase,
  user: AdminUser,
  value: unknown,
  providers: NewsletterDelivery["providers"],
) {
  assertAdministrator(user);
  const provider = deliveryProviderSchema.parse(value);
  if (provider !== "disabled" && !providers[provider].configured)
    throw new AdminError(409, "provider_unconfigured", "Complete this provider's setup first.");
  const current = await db
    .prepare("SELECT active_provider FROM newsletter_delivery_settings WHERE id = 1")
    .first<{ active_provider: DeliveryProvider }>();
  if ((current?.active_provider ?? "disabled") === provider) return { ok: true as const };
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `INSERT INTO newsletter_delivery_settings (id, active_provider, updated_at, updated_by)
         VALUES (1, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           active_provider = excluded.active_provider,
           updated_at = excluded.updated_at,
           updated_by = excluded.updated_by`,
      )
      .bind(provider, now, user.id),
    db
      .prepare(
        `INSERT INTO audit_log
          (id, actor_id, action, content_type, record_id, summary, created_at)
         VALUES (?, ?, 'newsletter.provider', 'newsletter', 'delivery', ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        user.id,
        provider === "disabled"
          ? "Disabled newsletter delivery."
          : `Selected ${provider} for newsletter delivery.`,
        now,
      ),
  ]);
  return { ok: true as const };
}

export async function updateNewsletterStatus(db: SqlDatabase, user: AdminUser, input: unknown) {
  assertAdministrator(user);
  const change = newsletterStatusSchema.parse(input);
  const existing = await db
    .prepare("SELECT status FROM newsletter_subscribers WHERE id = ?")
    .bind(change.id)
    .first<{ status: string }>();
  if (!existing) throw new AdminError(404, "not_found", "This subscriber no longer exists.");
  if (existing.status === change.status) {
    const subscriber = await db
      .prepare(
        "SELECT id, email, name, status, consent_at, source, updated_at FROM newsletter_subscribers WHERE id = ?",
      )
      .bind(change.id)
      .first<NewsletterSubscriber>();
    return { ok: true as const, subscriber };
  }
  const now = new Date().toISOString();
  const result = await db.batch([
    db
      .prepare(
        `UPDATE newsletter_subscribers
         SET status = ?, updated_at = ?, unsubscribed_at = ?
         WHERE id = ? AND status = ?`,
      )
      .bind(
        change.status,
        now,
        change.status === "unsubscribed" ? now : null,
        change.id,
        existing.status,
      ),
    db
      .prepare(
        `INSERT INTO audit_log
          (id, actor_id, action, content_type, record_id, summary, created_at)
         SELECT ?, ?, 'newsletter.status', 'newsletter', ?, ?, ? WHERE changes() = 1`,
      )
      .bind(crypto.randomUUID(), user.id, change.id, `Marked subscriber as ${change.status}.`, now),
  ]);
  if (result[0].meta?.changes !== 1) {
    throw new AdminError(409, "conflict", "This subscriber changed. Refresh and try again.");
  }
  const subscriber = await db
    .prepare(
      "SELECT id, email, name, status, consent_at, source, updated_at FROM newsletter_subscribers WHERE id = ?",
    )
    .bind(change.id)
    .first<NewsletterSubscriber>();
  return { ok: true as const, subscriber };
}

function csvCell(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function exportNewsletterCsv(db: SqlDatabase, user: AdminUser) {
  assertAdministrator(user);
  const rows = (
    await db
      .prepare(
        `SELECT name, email, consent_at, source
         FROM newsletter_subscribers
         WHERE status = 'subscribed'
         ORDER BY consent_at DESC`,
      )
      .all<{ name: string; email: string; consent_at: string; source: string }>()
  ).results;
  const header = ["Name", "Email", "Consent recorded", "Source"].map(csvCell).join(",");
  return `\uFEFF${[
    header,
    ...rows.map((row) =>
      [row.name, row.email, row.consent_at, row.source].map((value) => csvCell(value)).join(","),
    ),
  ].join("\r\n")}\r\n`;
}
