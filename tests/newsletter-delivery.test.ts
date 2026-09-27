import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminUser } from "../src/lib/auth/permissions.ts";
import {
  loadNewsletterSubscribers,
  setNewsletterTemplate,
  setNewsletterProvider,
  subscribeToNewsletter,
} from "../src/lib/newsletter/repository.server.ts";
import { renderNewsletterHtml, WELCOME_NEWSLETTER } from "../src/lib/newsletter/templates.ts";
import {
  getSubscriberStatusFromProvider,
  syncSubscriberWithProvider,
} from "../src/lib/newsletter/providers.server.ts";
import {
  reconcileNewsletterBatch,
  runAutomaticNewsletterReconciliation,
  syncSubscriberToActiveProvider,
} from "../src/lib/newsletter/sync.server.ts";
import { saveAdminContent } from "../src/lib/admin/repository.server.ts";
import { processEventNewsletterCampaigns } from "../src/lib/newsletter/workflow.server.ts";
import { TestDatabase } from "./d1-test-adapter.ts";

const admin: AdminUser = {
  id: "initial-administrator",
  email: "mortalerror@gmail.com",
  role: "administrator",
};
const providers = {
  kit: { configured: true },
  sender: { configured: false },
};
const credentials = {
  kit: { apiKey: "kit-secret", tagId: "church-tag" },
  sender: { apiToken: "sender-secret", groupId: "church-group" },
};
const subscriber = {
  id: "00000000-0000-4000-8000-000000000010",
  email: "reader@example.com",
  name: "Parish Reader",
  status: "subscribed" as const,
  consent_at: "2026-09-20T12:00:00.000Z",
  source: "homepage",
  updated_at: "2026-09-20T12:00:00.000Z",
};

test("delivery choice rejects incomplete providers and is audited without storing secrets", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  await assert.rejects(
    setNewsletterProvider(db, admin, "sender", providers),
    (error: unknown) =>
      !!error && typeof error === "object" && "status" in error && error.status === 409,
  );
  await setNewsletterProvider(db, admin, "kit", providers);
  const data = await loadNewsletterSubscribers(db, admin, 0, providers);
  assert.equal(data.delivery.activeProvider, "kit");
  assert.equal(data.delivery.providers.sender.configured, false);
  assert.ok(!JSON.stringify(data).includes("kit-secret"));
  assert.equal(
    db.sqlite.prepare("SELECT action FROM audit_log ORDER BY created_at DESC").get()?.action,
    "newsletter.provider",
  );
});

test("newsletter design selection is portable, audited and administrator-only", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  assert.equal((await loadNewsletterSubscribers(db, admin)).delivery.activeTemplate, "heritage");
  await setNewsletterTemplate(db, admin, "evening-prayer");
  assert.equal(
    (await loadNewsletterSubscribers(db, admin)).delivery.activeTemplate,
    "evening-prayer",
  );
  assert.equal(
    db.sqlite.prepare("SELECT action FROM audit_log ORDER BY rowid DESC").get()?.action,
    "newsletter.template",
  );
  await assert.rejects(
    setNewsletterTemplate(db, { ...admin, role: "publisher" }, "heritage"),
    (error: unknown) =>
      !!error && typeof error === "object" && "status" in error && error.status === 403,
  );
});

test("all welcome designs render portable email HTML with browser and unsubscribe links", () => {
  for (const template of ["heritage", "sunday-light", "evening-prayer"] as const) {
    const html = renderNewsletterHtml(template, WELCOME_NEWSLETTER, {
      origin: "https://acehou.org",
      mode: "email",
    });
    assert.match(html, /^<!doctype html>/);
    assert.match(html, /https:\/\/acehou\.org\/newsletter\/welcome/);
    assert.match(html, /\{\$unsubscribe_link\}/);
    assert.match(html, /Anglican Church of the Epiphany/);
    assert.ok(Buffer.byteLength(html) < 100_000);
  }
});

test("publishing a new event queues one HTML newsletter and the workflow sends it once", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const availability = { kit: { configured: false }, sender: { configured: true } };
  await setNewsletterProvider(db, admin, "sender", availability);
  const saved = await saveAdminContent(db, admin, {
    kind: "event",
    record: {
      slug: "ignored",
      title: "Harvest Thanksgiving",
      summary: "Join our church family for thanksgiving and fellowship.",
      description: "We will gather in worship and share a meal together.",
      status: "published",
      category: "Worship",
      starts_at: "2030-10-11T10:30:00-05:00",
      timezone: "America/Chicago",
      venue_name: "Main sanctuary",
      country_code: "US",
      registration_status: "not_required",
    },
  });
  assert.equal(saved.newsletterQueued, true);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM newsletter_campaigns").get()?.n, 1);
  const requests: Array<{ url: string; body: string }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    requests.push({ url: String(input), body: String(init?.body ?? "") });
    return requests.length === 1
      ? Response.json({ success: true, data: { id: "sender-campaign-1" } }, { status: 201 })
      : Response.json({ success: true, message: "Campaign started to send" });
  };
  const result = await processEventNewsletterCampaigns(
    db,
    {
      credentials,
      availability,
      identity: { email: "info@acehou.org", name: "Epiphany Houston" },
    },
    "https://acehou.org",
    3,
    undefined,
    fetcher,
  );
  assert.deepEqual(result, { ok: true, processed: 1, sent: 1, failed: 0 });
  assert.equal(requests.length, 2);
  assert.match(requests[0].body, /newsletter\/events\/harvest-thanksgiving/);
  assert.match(requests[0].body, /\{\$unsubscribe_link\}/);
  assert.match(requests[1].url, /sender-campaign-1\/send$/);
  assert.equal(db.sqlite.prepare("SELECT status FROM newsletter_campaigns").get()?.status, "sent");

  const rerun = await processEventNewsletterCampaigns(
    db,
    { credentials, availability },
    "https://acehou.org",
    3,
    undefined,
    fetcher,
  );
  assert.deepEqual(rerun, { ok: true, processed: 0, sent: 0, failed: 0 });
  assert.equal(requests.length, 2);
});

test("Kit event campaigns use Kit's unsubscribe URL variable", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const availability = { kit: { configured: true }, sender: { configured: false } };
  await setNewsletterProvider(db, admin, "kit", availability);
  await saveAdminContent(db, admin, {
    kind: "event",
    record: {
      slug: "ignored",
      title: "Evening Prayer",
      summary: "Join us for a quiet evening of prayer.",
      description: "We will gather for Scripture, reflection and prayer.",
      status: "published",
      category: "Worship",
      starts_at: "2030-10-12T18:00:00-05:00",
      timezone: "America/Chicago",
      venue_name: "Main sanctuary",
      country_code: "US",
      registration_status: "not_required",
    },
  });
  const requests: Array<{ url: string; body: string }> = [];
  const result = await processEventNewsletterCampaigns(
    db,
    {
      credentials: { ...credentials, kit: { apiKey: "kit-secret", tagId: "23793310" } },
      availability,
    },
    "https://acehou.org",
    3,
    undefined,
    async (input, init) => {
      requests.push({ url: String(input), body: String(init?.body ?? "") });
      return Response.json({ broadcast: { id: 42 } }, { status: 201 });
    },
  );
  assert.deepEqual(result, { ok: true, processed: 1, sent: 1, failed: 0 });
  assert.equal(requests.length, 1);
  assert.match(requests[0].body, /\{\{ unsubscribe_url \}\}/);
  assert.doesNotMatch(requests[0].body, /\{\$unsubscribe_link\}/);
});

test("provider failure leaves a published event queued safely for retry", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const availability = { kit: { configured: false }, sender: { configured: true } };
  await setNewsletterProvider(db, admin, "sender", availability);
  await saveAdminContent(db, admin, {
    kind: "event",
    record: {
      slug: "ignored",
      title: "Parish Picnic",
      summary: "A parish picnic for every generation.",
      description: "Bring family and friends for an afternoon together.",
      status: "published",
      category: "Fellowship",
      starts_at: "2030-11-01T12:00:00-05:00",
      timezone: "America/Chicago",
      venue_name: "Church grounds",
      country_code: "US",
      registration_status: "not_required",
    },
  });
  const result = await processEventNewsletterCampaigns(
    db,
    { credentials, availability },
    "https://acehou.org",
    3,
    undefined,
    async () => Response.json({ message: "suspended" }, { status: 403 }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.failed, 1);
  const campaign = db.sqlite
    .prepare("SELECT status, last_error FROM newsletter_campaigns")
    .get() as { status: string; last_error: string };
  assert.equal(campaign.status, "failed");
  assert.match(campaign.last_error, /rejected delivery/);
  assert.equal(db.sqlite.prepare("SELECT status FROM events").get()?.status, "published");
});

test("a removed provider credential never prevents a local subscriber change", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  await setNewsletterProvider(db, admin, "kit", providers);
  const result = await syncSubscriberToActiveProvider(
    db,
    {
      credentials,
      availability: { kit: { configured: false }, sender: { configured: false } },
    },
    subscriber,
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /local change was saved/);
});

test("Kit adapter creates an active subscriber and assigns the church tag", async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    return requests.length === 1
      ? Response.json({ subscriber: { id: 42, state: "active" } })
      : Response.json({});
  };
  const result = await syncSubscriberWithProvider("kit", credentials, subscriber, null, fetcher);
  assert.deepEqual(result, { externalId: "42", remoteStatus: "active" });
  assert.equal(requests.length, 2);
  assert.match(requests[1].url, /tags\/church-tag\/subscribers\/42$/);
  assert.equal(
    (requests[0].init?.headers as Record<string, string>)["X-Kit-Api-Key"],
    "kit-secret",
  );
  assert.match(String(requests[0].init?.body), /reader@example\.com/);
});

test("Kit adapter finds and suppresses a legacy subscriber without a stored Kit id", async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    if (requests.length === 1)
      return Response.json({
        subscribers: [{ id: 42, email_address: subscriber.email, state: "active" }],
      });
    return new Response(null, { status: requests.length === 2 ? 204 : 200 });
  };
  const result = await syncSubscriberWithProvider(
    "kit",
    credentials,
    { ...subscriber, status: "unsubscribed" },
    null,
    fetcher,
  );
  assert.deepEqual(result, { externalId: "42", remoteStatus: "cancelled" });
  assert.equal(requests.length, 3);
  assert.match(requests[0].url, /subscribers\?email_address=reader%40example\.com$/);
  assert.equal(requests[1].init?.method, "DELETE");
  assert.match(requests[1].url, /tags\/church-tag\/subscribers\/42$/);
  assert.equal(requests[2].init?.method, "POST");
  assert.match(requests[2].url, /subscribers\/42\/unsubscribe$/);
});

test("Sender adapter updates a subscriber when the create endpoint reports a duplicate", async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    return new Response(null, { status: requests.length === 1 ? 422 : 204 });
  };
  const result = await syncSubscriberWithProvider(
    "sender",
    credentials,
    subscriber,
    "existing-id",
    fetcher,
  );
  assert.deepEqual(result, { externalId: "existing-id", remoteStatus: "active" });
  assert.equal(requests[1].init?.method, "PATCH");
  assert.match(requests[1].url, /reader%40example\.com$/);
  assert.equal(
    (requests[1].init?.headers as Record<string, string>).Authorization,
    "Bearer sender-secret",
  );
});

test("Sender status adapter recognizes a remote email unsubscribe", async () => {
  const fetcher: typeof fetch = async () =>
    Response.json({
      data: {
        id: "sender-id",
        status: { email: "unsubscribed", temail: "active" },
      },
    });
  const result = await getSubscriberStatusFromProvider(
    "sender",
    credentials,
    subscriber,
    subscriber.email,
    fetcher,
  );
  assert.deepEqual(result, {
    externalId: "sender-id",
    remoteStatus: "unsubscribed",
    suppressed: true,
  });
});

test("provider reconciliation imports remote suppression without restoring subscribers", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const saved = await subscribeToNewsletter(db, {
    name: subscriber.name,
    email: subscriber.email,
    consent: true,
    website: "",
    startedAt: Date.now() - 2_000,
  });
  const availability = { kit: { configured: false }, sender: { configured: true } };
  await setNewsletterProvider(db, admin, "sender", availability);
  db.sqlite
    .prepare(
      `INSERT INTO newsletter_provider_sync
        (subscriber_id, provider, external_id, remote_status, last_attempt_at, last_synced_at, last_error)
       VALUES (?, 'sender', ?, 'active', ?, ?, NULL)`,
    )
    .run(saved.subscriber.id, subscriber.email, subscriber.updated_at, subscriber.updated_at);

  const result = await reconcileNewsletterBatch(
    db,
    admin,
    { credentials, availability },
    25,
    async () => Response.json({ data: { status: { email: "unsubscribed" } } }),
  );
  assert.deepEqual(result, {
    ok: true,
    processed: 1,
    suppressed: 1,
    unchanged: 0,
    failed: 0,
  });
  assert.equal(
    db.sqlite
      .prepare("SELECT status FROM newsletter_subscribers WHERE id = ?")
      .get(saved.subscriber.id)?.status,
    "unsubscribed",
  );
  assert.equal(
    db.sqlite.prepare("SELECT action FROM audit_log ORDER BY created_at DESC").get()?.action,
    "newsletter.reconcile",
  );
  assert.ok(
    db.sqlite
      .prepare(
        "SELECT last_reconciled_at FROM newsletter_provider_sync WHERE subscriber_id = ? AND provider = 'sender'",
      )
      .get(saved.subscriber.id)?.last_reconciled_at,
  );
  const summary = await loadNewsletterSubscribers(db, admin, 0, availability);
  assert.equal(summary.delivery.sync.pending, 0);
  assert.equal(summary.delivery.sync.synced, 1);
});

test("automatic reconciliation imports suppression and records healthy job state", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const saved = await subscribeToNewsletter(db, {
    name: subscriber.name,
    email: subscriber.email,
    consent: true,
    website: "",
    startedAt: Date.now() - 2_000,
  });
  const availability = { kit: { configured: false }, sender: { configured: true } };
  await setNewsletterProvider(db, admin, "sender", availability);
  db.sqlite
    .prepare(
      `INSERT INTO newsletter_provider_sync
        (subscriber_id, provider, external_id, remote_status, last_attempt_at, last_synced_at, last_error)
       VALUES (?, 'sender', ?, 'active', ?, ?, NULL)`,
    )
    .run(saved.subscriber.id, subscriber.email, subscriber.updated_at, subscriber.updated_at);

  const result = await runAutomaticNewsletterReconciliation(
    db,
    { credentials, availability },
    25,
    async () => Response.json({ data: { status: { email: "unsubscribed" } } }),
  );
  assert.equal(result.ok, true);
  assert.equal("suppressed" in result ? result.suppressed : 0, 1);
  assert.equal(
    db.sqlite
      .prepare("SELECT status FROM newsletter_subscribers WHERE id = ?")
      .get(saved.subscriber.id)?.status,
    "unsubscribed",
  );
  const settings = db.sqlite
    .prepare(
      `SELECT last_auto_reconcile_at, last_auto_reconcile_error
       FROM newsletter_delivery_settings WHERE id = 1`,
    )
    .get();
  assert.ok(settings?.last_auto_reconcile_at);
  assert.equal(settings?.last_auto_reconcile_error, null);
  assert.match(
    String(db.sqlite.prepare("SELECT summary FROM audit_log ORDER BY rowid DESC").get()?.summary),
    /^Automatic provider check imported sender suppression status:/,
  );
});

test("automatic reconciliation safely skips when delivery is disabled", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  let requested = false;
  const result = await runAutomaticNewsletterReconciliation(
    db,
    { credentials, availability: providers },
    25,
    async () => {
      requested = true;
      return Response.json({});
    },
  );
  assert.deepEqual(result, { ok: true, skipped: true, reason: "disabled" });
  assert.equal(requested, false);
});

test("portable delivery data contains provider state but not credentials", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  await subscribeToNewsletter(db, {
    name: subscriber.name,
    email: subscriber.email,
    consent: true,
    website: "",
    startedAt: Date.now() - 2_000,
  });
  await setNewsletterProvider(db, admin, "kit", providers);
  const row = db.sqlite
    .prepare("SELECT active_provider FROM newsletter_delivery_settings WHERE id = 1")
    .get();
  assert.equal(row?.active_provider, "kit");
  const schema = db.sqlite
    .prepare("SELECT sql FROM sqlite_master WHERE name = 'newsletter_delivery_settings'")
    .get() as { sql: string };
  assert.ok(!schema.sql.includes("api_key"));
  assert.ok(!schema.sql.includes("token"));
});
