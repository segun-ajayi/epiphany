import { z } from "zod";
import { AdminError, type AdminUser } from "../auth/permissions.ts";
import type { SqlDatabase } from "../db/sql.types.ts";
import type { NewsletterProviderConfig, ProviderName } from "./providers.server.ts";
import type { NewsletterCampaign, NewsletterTemplateId } from "./schemas.ts";
import { renderNewsletterHtml, type NewsletterDocument } from "./templates.ts";

const documentSchema = z.object({
  slug: z.string().min(1).max(300),
  subject: z.string().min(1).max(300),
  preheader: z.string().max(600),
  eyebrow: z.string().min(1).max(160),
  title: z.string().min(1).max(300),
  greeting: z.string().min(1).max(300),
  paragraphs: z.array(z.string().max(30000)).min(1).max(10),
  quote: z.string().max(1000),
  quoteReference: z.string().max(300),
  ctaLabel: z.string().min(1).max(160),
  ctaUrl: z.string().min(1).max(1000),
});

type CampaignRow = {
  id: string;
  event_id: string;
  slug: string;
  template_id: NewsletterTemplateId;
  subject: string;
  preheader: string;
  document_json: string;
  provider: ProviderName | null;
  status: NewsletterCampaign["status"];
  external_id: string | null;
  attempts: number;
  send_after: string;
  last_attempt_at: string | null;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
  created_by: string | null;
};

class CampaignDeliveryError extends Error {}

async function requestProvider(url: string, init: RequestInit, fetcher: typeof fetch) {
  try {
    return await fetcher(url, { ...init, signal: AbortSignal.timeout(12_000) });
  } catch {
    throw new CampaignDeliveryError("The email provider did not respond.");
  }
}

async function responseObject(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function providerFailure(provider: ProviderName, response: Response): never {
  const name = provider === "sender" ? "Sender" : "Kit";
  if ([401, 403].includes(response.status)) {
    throw new CampaignDeliveryError(
      `${name} rejected delivery. Check its account and credential status.`,
    );
  }
  if (response.status === 429) {
    throw new CampaignDeliveryError(`${name} is rate limiting delivery. The campaign will retry.`);
  }
  throw new CampaignDeliveryError(`${name} could not accept this campaign.`);
}

async function createProviderCampaign(
  provider: ProviderName,
  config: NewsletterProviderConfig,
  campaign: CampaignRow,
  document: NewsletterDocument,
  html: string,
  fetcher: typeof fetch,
) {
  if (provider === "sender") {
    const response = await requestProvider(
      "https://api.sender.net/v2/campaigns",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.credentials.sender.apiToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: `Website event: ${document.title}`,
          subject: document.subject,
          from: config.identity?.name || "Anglican Church of the Epiphany, Houston",
          reply_to: config.identity?.email || "info@acehou.org",
          preheader: document.preheader,
          content_type: "html",
          google_analytics: 0,
          auto_followup_active: false,
          groups: [config.credentials.sender.groupId],
          content: html,
        }),
      },
      fetcher,
    );
    if (!response.ok) providerFailure(provider, response);
    const payload = await responseObject(response);
    const data = (payload.data ?? payload) as Record<string, unknown>;
    const id = typeof data.id === "string" || typeof data.id === "number" ? String(data.id) : "";
    if (!id) throw new CampaignDeliveryError("Sender did not return a campaign identifier.");
    return { externalId: id, acceptedAsSent: false };
  }

  const tagId = Number(config.credentials.kit.tagId);
  if (!Number.isSafeInteger(tagId) || tagId <= 0) {
    throw new CampaignDeliveryError("Kit’s newsletter tag identifier is not valid.");
  }
  const now = new Date().toISOString();
  const response = await requestProvider(
    "https://api.kit.com/v4/broadcasts",
    {
      method: "POST",
      headers: {
        "X-Kit-Api-Key": config.credentials.kit.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email_address: null,
        content: html,
        description: `Website event: ${document.title}`,
        public: true,
        published_at: now,
        send_at: now,
        thumbnail_alt: null,
        thumbnail_url: null,
        preview_text: document.preheader,
        subject: document.subject,
        subscriber_filter: [{ all: [{ type: "tag", ids: [tagId] }] }],
      }),
    },
    fetcher,
  );
  if (!response.ok) providerFailure(provider, response);
  const payload = await responseObject(response);
  const data = (payload.broadcast ?? payload) as Record<string, unknown>;
  const id = typeof data.id === "string" || typeof data.id === "number" ? String(data.id) : "";
  if (!id) throw new CampaignDeliveryError("Kit did not return a broadcast identifier.");
  return { externalId: id, acceptedAsSent: true };
}

async function sendProviderCampaign(
  provider: ProviderName,
  config: NewsletterProviderConfig,
  externalId: string,
  fetcher: typeof fetch,
) {
  if (provider === "kit") return;
  const response = await requestProvider(
    `https://api.sender.net/v2/campaigns/${encodeURIComponent(externalId)}/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.credentials.sender.apiToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
    fetcher,
  );
  if (!response.ok) providerFailure(provider, response);
}

async function recordWorkflowHealth(db: SqlDatabase, error: string | null) {
  await db
    .prepare(
      `UPDATE newsletter_delivery_settings
       SET last_event_workflow_at = ?, last_event_workflow_error = ?
       WHERE id = 1`,
    )
    .bind(new Date().toISOString(), error)
    .run();
}

export async function processEventNewsletterCampaigns(
  db: SqlDatabase,
  config: NewsletterProviderConfig,
  origin: string,
  limit = 3,
  campaignId?: string,
  fetcher: typeof fetch = fetch,
) {
  const settings = await db
    .prepare(
      `SELECT active_provider, event_workflow_enabled
       FROM newsletter_delivery_settings WHERE id = 1`,
    )
    .first<{ active_provider: "disabled" | ProviderName; event_workflow_enabled: number }>();
  if (!settings || settings.event_workflow_enabled !== 1) {
    return { ok: true as const, skipped: true as const, reason: "disabled" };
  }
  if (settings.active_provider === "disabled") {
    const error = "Choose a delivery provider before event newsletters can be sent.";
    await recordWorkflowHealth(db, error);
    return { ok: false as const, skipped: true as const, reason: "provider_disabled", error };
  }
  const provider = settings.active_provider;
  if (!config.availability[provider].configured) {
    const error = `Complete ${provider === "kit" ? "Kit" : "Sender"} setup before event newsletters can be sent.`;
    await recordWorkflowHealth(db, error);
    return { ok: false as const, skipped: true as const, reason: "provider_unconfigured", error };
  }
  const rows = await db
    .prepare(
      `SELECT * FROM newsletter_campaigns
       WHERE status IN ('queued', 'draft', 'failed')
         AND send_after <= ?
         AND (? IS NULL OR id = ?)
       ORDER BY send_after, created_at
       LIMIT ?`,
    )
    .bind(new Date().toISOString(), campaignId ?? null, campaignId ?? null, limit)
    .all<CampaignRow>();
  let sent = 0;
  let failed = 0;
  for (const campaign of rows.results) {
    const selectedProvider = campaign.provider ?? provider;
    if (campaign.provider && campaign.provider !== provider) {
      const message = `This campaign was created in ${campaign.provider}; switch back to finish delivery.`;
      await db
        .prepare("UPDATE newsletter_campaigns SET status = 'failed', last_error = ? WHERE id = ?")
        .bind(message, campaign.id)
        .run();
      failed++;
      continue;
    }
    const now = new Date().toISOString();
    const claimStatus = campaign.external_id ? "sending" : "creating";
    const claimed = await db
      .prepare(
        `UPDATE newsletter_campaigns
         SET status = ?, provider = ?, attempts = attempts + 1,
             last_attempt_at = ?, last_error = NULL
         WHERE id = ? AND status = ?`,
      )
      .bind(claimStatus, selectedProvider, now, campaign.id, campaign.status)
      .run();
    if (claimed.meta?.changes !== 1) continue;
    try {
      const document = documentSchema.parse(JSON.parse(campaign.document_json));
      let externalId = campaign.external_id;
      if (!externalId) {
        const html = renderNewsletterHtml(campaign.template_id, document, {
          origin,
          browserViewUrl: `${new URL(origin).origin}/newsletter/events/${encodeURIComponent(campaign.slug)}`,
          unsubscribeUrl:
            selectedProvider === "kit" ? "{{ unsubscribe_url }}" : "{$unsubscribe_link}",
          mode: "email",
        });
        const created = await createProviderCampaign(
          selectedProvider,
          config,
          campaign,
          document,
          html,
          fetcher,
        );
        externalId = created.externalId;
        if (created.acceptedAsSent) {
          await markCampaignSent(db, campaign, selectedProvider, externalId);
          sent++;
          continue;
        }
        await db
          .prepare(
            `UPDATE newsletter_campaigns
             SET status = 'draft', external_id = ?, provider = ? WHERE id = ?`,
          )
          .bind(externalId, selectedProvider, campaign.id)
          .run();
        await db
          .prepare(
            "UPDATE newsletter_campaigns SET status = 'sending' WHERE id = ? AND status = 'draft'",
          )
          .bind(campaign.id)
          .run();
      }
      await sendProviderCampaign(selectedProvider, config, externalId, fetcher);
      await markCampaignSent(db, campaign, selectedProvider, externalId);
      sent++;
    } catch (error) {
      failed++;
      const message =
        error instanceof CampaignDeliveryError
          ? error.message
          : "The event newsletter could not be delivered.";
      const retryAt = new Date(
        Date.now() + Math.min(campaign.attempts + 1, 4) * 15 * 60_000,
      ).toISOString();
      await db
        .prepare(
          `UPDATE newsletter_campaigns
           SET status = 'failed', last_error = ?, send_after = ? WHERE id = ?`,
        )
        .bind(message, retryAt, campaign.id)
        .run();
    }
  }
  const error = failed
    ? `${failed} event newsletter${failed === 1 ? "" : "s"} need attention.`
    : null;
  await recordWorkflowHealth(db, error);
  return { ok: failed === 0, processed: rows.results.length, sent, failed };
}

async function markCampaignSent(
  db: SqlDatabase,
  campaign: CampaignRow,
  provider: ProviderName,
  externalId: string,
) {
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `UPDATE newsletter_campaigns
         SET status = 'sent', provider = ?, external_id = ?, sent_at = ?, last_error = NULL
         WHERE id = ?`,
      )
      .bind(provider, externalId, now, campaign.id),
    db
      .prepare(
        `INSERT INTO audit_log
          (id, actor_id, action, content_type, record_id, summary, created_at)
         SELECT ?, created_by, 'newsletter.event-sent', 'newsletter', id, ?, ?
         FROM newsletter_campaigns WHERE id = ? AND created_by IS NOT NULL`,
      )
      .bind(
        crypto.randomUUID(),
        `Sent event newsletter through ${provider === "kit" ? "Kit" : "Sender"}.`,
        now,
        campaign.id,
      ),
  ]);
}

export async function retryEventNewsletterCampaign(db: SqlDatabase, user: AdminUser, id: string) {
  if (user.role !== "administrator") {
    throw new AdminError(403, "forbidden", "Only administrators may retry newsletters.");
  }
  const campaign = await db
    .prepare("SELECT status, external_id FROM newsletter_campaigns WHERE id = ?")
    .bind(id)
    .first<{ status: NewsletterCampaign["status"]; external_id: string | null }>();
  if (!campaign) throw new AdminError(404, "not_found", "This newsletter no longer exists.");
  if (campaign.status === "sent") {
    throw new AdminError(409, "already_sent", "This newsletter has already been sent.");
  }
  if (["creating", "sending"].includes(campaign.status)) {
    throw new AdminError(409, "in_progress", "This newsletter is already being processed.");
  }
  await db
    .prepare(
      `UPDATE newsletter_campaigns
       SET status = ?, send_after = ?, last_error = NULL WHERE id = ?`,
    )
    .bind(campaign.external_id ? "draft" : "queued", new Date().toISOString(), id)
    .run();
}

export async function renderEventNewsletterBrowserView(
  db: SqlDatabase,
  slug: string,
  origin: string,
) {
  const campaign = await db
    .prepare(
      `SELECT c.template_id, c.document_json
       FROM newsletter_campaigns c
       JOIN events e ON e.id = c.event_id
       WHERE c.slug = ? AND e.status = 'published' AND e.published_at <= ?`,
    )
    .bind(slug, new Date().toISOString())
    .first<{ template_id: NewsletterTemplateId; document_json: string }>();
  if (!campaign) return null;
  const document = documentSchema.parse(JSON.parse(campaign.document_json));
  return renderNewsletterHtml(campaign.template_id, document, {
    origin,
    browserViewUrl: `${new URL(origin).origin}/newsletter/events/${encodeURIComponent(slug)}`,
    mode: "browser",
  });
}
