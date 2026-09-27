import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  digestToken,
  findActiveAdmin,
  newToken,
  nowSeconds,
} from "../src/lib/auth/session.server.ts";
import { attachDatabase } from "../src/lib/db/runtime.server.ts";
import {
  AdminError,
  assertContentPermission,
  type AdminUser,
} from "../src/lib/auth/permissions.ts";
import { eventSchema, ministrySchema, sermonSchema } from "../src/lib/admin/schemas.ts";
import { loadAdminContent, saveAdminContent } from "../src/lib/admin/repository.server.ts";
import {
  handlePublicMedia,
  validateImageUpload,
  validatePdfUpload,
  type UploadedImage,
} from "../src/lib/admin/media.server.ts";
import {
  assertSameOriginMutation,
  readLimitedJson,
  handleAdminContent,
} from "../src/lib/admin/http.server.ts";
import { protectAdminResponse, protectResponse } from "../src/lib/admin/headers.ts";
import { TestDatabase } from "./d1-test-adapter.ts";

const admin: AdminUser = {
  id: "initial-administrator",
  email: "mortalerror@gmail.com",
  role: "administrator",
};

function hasStatus(status: number) {
  return (error: unknown) => error instanceof AdminError && error.status === status;
}

const ministry = (overrides = {}) => ({
  slug: "test-ministry",
  name: "Test ministry",
  summary: "A welcoming ministry.",
  description: "This is test content only.",
  meeting_schedule: "Second Saturday at 10:00 AM",
  meeting_location: "Fellowship hall",
  leader_name: "Test Leader",
  leader_title: "Ministry coordinator",
  contact_email: "ministry@example.com",
  contact_phone: "+1 281 555 0100",
  audience: "Adults and families",
  what_to_expect: "A welcoming gathering with prayer and practical service.",
  join_instructions: "Email the coordinator before your first visit.",
  status: "draft",
  display_order: 0,
  ...overrides,
});
const event = (overrides = {}) => ({
  slug: "test-event",
  title: "Test event",
  summary: "A welcoming event.",
  description: "This is test content only.",
  status: "draft",
  category: "Fellowship",
  starts_at: "2030-10-11T10:30:00-05:00",
  timezone: "America/Chicago",
  venue_name: "Test hall",
  country_code: "US",
  registration_status: "not_required",
  ...overrides,
});
const sermon = (overrides = {}) => ({
  slug: "test-sermon",
  title: "Test sermon",
  summary: "A concise sermon summary.",
  description: "A complete sermon description for testing.",
  speaker: "Test Preacher",
  sermon_date: "2026-09-20",
  scripture: "John 1:1-5",
  series: "Test series",
  topic: "Hope",
  youtube_url: "https://www.youtube.com/watch?v=abcdefghijk",
  audio_url: "",
  notes_url: "",
  duration_seconds: 1800,
  status: "draft",
  ...overrides,
});

test("bootstrap is idempotent and never restores a revoked or downgraded account", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  db.bootstrap();
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM admin_users").get()?.n, 1);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM audit_log").get()?.n, 1);
  assert.deepEqual(await findActiveAdmin(db, "MORTALERROR@GMAIL.COM"), admin);
  await assert.rejects(findActiveAdmin(db, "unknown@example.com"), hasStatus(403));
  db.sqlite.exec("UPDATE admin_users SET active = 0, role = 'editor'");
  db.bootstrap();
  await assert.rejects(findActiveAdmin(db, admin.email), hasStatus(403));
  assert.equal(db.sqlite.prepare("SELECT role FROM admin_users").get()?.role, "editor");
});

test("editors are limited to drafts, publishers and administrators can publish", () => {
  const editor = { ...admin, role: "editor" as const };
  assert.doesNotThrow(() => assertContentPermission(editor, "draft"));
  for (const status of ["published", "archived", "cancelled"])
    assert.throws(() => assertContentPermission(editor, status), hasStatus(403));
  assert.throws(() => assertContentPermission(editor, "draft", "published"), hasStatus(403));
  assert.doesNotThrow(() => assertContentPermission({ ...admin, role: "publisher" }, "published"));
});

test("schemas reject incomplete publishing, unsafe paths and invalid event details", () => {
  assert.equal(ministrySchema.parse(ministry()).status, "draft");
  for (const overrides of [
    { slug: "Unsafe Slug" },
    { image_path: "https://evil.test/a.jpg" },
    { image_path: "/../secret" },
    { image_path: "/%2e%2e/secret" },
    { status: "published", summary: "" },
    { status: "published", image_path: "/media/a.jpg" },
    { revision: 100 },
    { created_by: "forged" },
  ]) {
    assert.equal(ministrySchema.safeParse(ministry(overrides)).success, false);
  }
  assert.equal(eventSchema.parse(event()).starts_at, "2030-10-11T15:30:00.000Z");
  assert.equal(
    eventSchema.parse(event({ registration_status: "open" })).registration_status,
    "open",
  );
  for (const overrides of [
    { starts_at: "2030-10-11T10:30:00" },
    { ends_at: "2030-10-10T10:30:00Z" },
    { timezone: "Fake/Zone" },
    { registration_status: "invite_only" },
    { status: "published", venue_name: "" },
    { capacity: 0 },
  ]) {
    assert.equal(eventSchema.safeParse(event(overrides)).success, false);
  }
  assert.equal(sermonSchema.parse(sermon()).sermon_date, "2026-09-20");
  for (const overrides of [
    { speaker: "" },
    { sermon_date: "September 20" },
    { youtube_url: "http://youtube.com/watch?v=abcdefghijk" },
    { youtube_url: "https://example.com/video" },
    { audio_url: "javascript:alert(1)" },
    { notes_url: "/../private.pdf" },
    { duration_seconds: 0 },
    { status: "published", youtube_url: "", audio_url: "" },
  ]) {
    assert.equal(sermonSchema.safeParse(sermon(overrides)).success, false);
  }
});

test("sermons save, publish and retain permanent URLs", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const created = await saveAdminContent(db, admin, { kind: "sermon", record: sermon() });
  assert.equal(created.revision, 1);
  const published = await saveAdminContent(db, admin, {
    kind: "sermon",
    ...created,
    record: sermon({ status: "published" }),
  });
  assert.equal(published.revision, 2);
  assert.equal(db.sqlite.prepare("SELECT status FROM sermons").get()?.status, "published");
  await saveAdminContent(db, admin, {
    kind: "sermon",
    ...published,
    record: sermon({ status: "published", title: "Renamed sermon" }),
  });
  assert.equal(db.sqlite.prepare("SELECT slug FROM sermons").get()?.slug, "test-sermon");
});

test("mutations require same-origin JSON and the custom header", () => {
  const make = (headers = {}, method = "POST") =>
    new Request("https://church.test/api/admin/content", {
      method,
      headers: {
        origin: "https://church.test",
        "content-type": "application/json",
        "x-admin-request": "1",
        ...headers,
      },
    });
  assert.doesNotThrow(() => assertSameOriginMutation(make()));
  assert.doesNotThrow(() =>
    assertSameOriginMutation(
      make({ "content-type": "multipart/form-data; boundary=test" }),
      "https://church.test",
      ["application/json", "multipart/form-data"],
    ),
  );
  for (const headers of [
    { origin: "https://evil.test" },
    { origin: "null" },
    { "x-admin-request": "" },
    { "content-type": "text/plain" },
    { "sec-fetch-site": "cross-site" },
  ]) {
    assert.throws(() => assertSameOriginMutation(make(headers)), hasStatus(403));
  }
  assert.throws(() => assertSameOriginMutation(make({}, "GET")), hasStatus(403));
});

test("request bodies are size limited even without Content-Length", async () => {
  const request = (body: string) =>
    new Request("https://church.test/api/admin/content", { method: "POST", body });
  assert.deepEqual(await readLimitedJson(request('{"ok":true}')), { ok: true });
  await assert.rejects(readLimitedJson(request("invalid")), hasStatus(400));
  await assert.rejects(readLimitedJson(request("x".repeat(65537))), hasStatus(413));
});

test("create, publish, schedule, edit and archive preserve audit history and stable URLs", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const result = await saveAdminContent(db, admin, {
    kind: "ministry",
    record: ministry({ description: "'); DROP TABLE ministries; --" }),
  });
  assert.equal(result.revision, 1);
  assert.equal(
    db.sqlite.prepare("SELECT description FROM ministries").get()?.description,
    "'); DROP TABLE ministries; --",
  );
  assert.deepEqual(
    {
      ...db.sqlite
        .prepare(
          "SELECT meeting_location, leader_title, contact_phone, what_to_expect, join_instructions FROM ministries",
        )
        .get(),
    },
    {
      meeting_location: "Fellowship hall",
      leader_title: "Ministry coordinator",
      contact_phone: "+1 281 555 0100",
      what_to_expect: "A welcoming gathering with prayer and practical service.",
      join_instructions: "Email the coordinator before your first visit.",
    },
  );
  const published = await saveAdminContent(db, admin, {
    kind: "ministry",
    ...result,
    record: ministry({ status: "published" }),
  });
  assert.equal(published.revision, 2);
  assert.ok(db.sqlite.prepare("SELECT published_at FROM ministries").get()?.published_at);
  const renamed = await saveAdminContent(db, admin, {
    kind: "ministry",
    ...published,
    record: ministry({ status: "published", slug: "different", name: "Renamed ministry" }),
  });
  assert.equal(db.sqlite.prepare("SELECT slug FROM ministries").get()?.slug, "test-ministry");
  await saveAdminContent(db, admin, {
    kind: "ministry",
    ...renamed,
    record: ministry({ status: "archived" }),
  });
  assert.equal(
    db.sqlite.prepare("SELECT COUNT(*) AS n FROM ministries WHERE status='published'").get()?.n,
    0,
  );
  const scheduled = await saveAdminContent(db, admin, {
    kind: "event",
    record: event({ status: "published", published_at: "2030-10-01T09:00:00-05:00" }),
  });
  const row = db.sqlite
    .prepare("SELECT published_at, starts_at FROM events WHERE id=?")
    .get(scheduled.id);
  assert.equal(row?.published_at, "2030-10-01T14:00:00.000Z");
  assert.equal(
    db.sqlite
      .prepare(
        "SELECT COUNT(*) AS n FROM events WHERE status='published' AND published_at <= '2026-09-02T00:00:00.000Z'",
      )
      .get()?.n,
    0,
  );
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM audit_log").get()?.n, 6);
});

test("duplicate names get unique generated slugs; stale edits and write races add no audit", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const result = await saveAdminContent(db, admin, { kind: "ministry", record: ministry() });
  const duplicate = await saveAdminContent(db, admin, {
    kind: "ministry",
    record: ministry({ slug: "ignored-by-server" }),
  });
  assert.equal(
    db.sqlite.prepare("SELECT slug FROM ministries WHERE id = ?").get(result.id)?.slug,
    "test-ministry",
  );
  assert.equal(
    db.sqlite.prepare("SELECT slug FROM ministries WHERE id = ?").get(duplicate.id)?.slug,
    "test-ministry-2",
  );
  await assert.rejects(
    saveAdminContent(db, admin, { kind: "ministry", ...result, revision: 42, record: ministry() }),
    hasStatus(409),
  );
  // Simulate another writer after the optimistic read, immediately before the batch.
  db.beforeBatch = () => db.sqlite.exec("UPDATE ministries SET revision=revision+1");
  await assert.rejects(
    saveAdminContent(db, admin, {
      kind: "ministry",
      ...result,
      record: ministry({ name: "Stale overwrite" }),
    }),
    hasStatus(409),
  );
  assert.equal(db.sqlite.prepare("SELECT name FROM ministries").get()?.name, "Test ministry");
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM audit_log").get()?.n, 3);
});

test("uploads are verified, stored with content, served immutably and replaced atomically", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const file = new File([Uint8Array.of(0xff, 0xd8, 0xff, 0xdb, 1, 2, 3)], "photo.jpg", {
    type: "image/jpeg",
  });
  const image = await validateImageUpload(file);
  assert.ok(image);
  const saved = await saveAdminContent(db, admin, { kind: "ministry", record: ministry() }, image);
  const stored = db.sqlite
    .prepare("SELECT image_path FROM ministries WHERE id = ?")
    .get(saved.id) as { image_path: string };
  assert.equal(stored.image_path, `/media/${image.id}`);

  const request = new Request(`https://church.test${stored.image_path}`);
  attachDatabase(request, db, "https://church.test");
  const response = await handlePublicMedia(request, image.id);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.match(response.headers.get("cache-control")!, /immutable/);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array(image.bytes));

  const replacement: UploadedImage = {
    id: crypto.randomUUID(),
    contentType: "image/webp",
    bytes: Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]).buffer,
    byteSize: 12,
  };
  await saveAdminContent(
    db,
    admin,
    { kind: "ministry", ...saved, record: ministry() },
    replacement,
  );
  assert.equal(
    db.sqlite.prepare("SELECT COUNT(*) AS n FROM media_assets WHERE id = ?").get(image.id)?.n,
    0,
  );
  assert.equal(
    db.sqlite.prepare("SELECT COUNT(*) AS n FROM media_assets WHERE id = ?").get(replacement.id)?.n,
    1,
  );
  await assert.rejects(
    validateImageUpload(new File(["<svg/>"], "unsafe.svg", { type: "image/svg+xml" })),
    hasStatus(400),
  );
});

test("authenticated multipart submissions save an uploaded image", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const token = newToken();
  const now = nowSeconds();
  db.sqlite.exec("UPDATE admin_users SET google_subject = 'local-test-subject'");
  db.sqlite
    .prepare(
      "INSERT INTO admin_sessions (token_hash, user_id, auth_version, created_at, expires_at) SELECT ?, id, auth_version, ?, ? FROM admin_users",
    )
    .run(digestToken(token), now, now + 600);
  const form = new FormData();
  form.set(
    "payload",
    JSON.stringify({
      kind: "ministry",
      record: ministry({ slug: undefined }),
    }),
  );
  form.set(
    "image",
    new File([Uint8Array.of(0xff, 0xd8, 0xff, 0xdb, 1, 2, 3)], "photo.jpg", {
      type: "image/jpeg",
    }),
  );
  const request = new Request("https://church.test/api/admin/content", {
    method: "POST",
    headers: {
      cookie: `__Host-epiphany_session=${token}`,
      origin: "https://church.test",
      "x-admin-request": "1",
    },
    body: form,
  });
  attachDatabase(request, db, "https://church.test");
  const response = await handleAdminContent(request);
  assert.equal(response.status, 201, await response.clone().text());
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM media_assets").get()?.n, 1);
});

test("sermon notes PDFs are verified, served and removed atomically", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const pdf = await validatePdfUpload(
    new File([new TextEncoder().encode("%PDF-1.7\n% test notes")], "notes.pdf", {
      type: "application/pdf",
    }),
  );
  assert.ok(pdf);
  const saved = await saveAdminContent(db, admin, { kind: "sermon", record: sermon() }, null, pdf);
  const stored = db.sqlite.prepare("SELECT notes_url FROM sermons WHERE id = ?").get(saved.id) as {
    notes_url: string;
  };
  assert.equal(stored.notes_url, `/media/${pdf.id}`);

  const request = new Request(`https://church.test${stored.notes_url}`);
  attachDatabase(request, db, "https://church.test");
  const response = await handlePublicMedia(request, pdf.id);
  assert.equal(response.headers.get("content-type"), "application/pdf");
  assert.match(new TextDecoder().decode(await response.arrayBuffer()), /^%PDF-/);

  await saveAdminContent(db, admin, {
    kind: "sermon",
    ...saved,
    remove_notes: true,
    record: sermon({ notes_url: stored.notes_url }),
  });
  assert.equal(db.sqlite.prepare("SELECT notes_url FROM sermons").get()?.notes_url, null);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM media_assets").get()?.n, 0);
  await assert.rejects(
    validatePdfUpload(new File(["not a pdf"], "notes.pdf", { type: "application/pdf" })),
    hasStatus(400),
  );
});

test("an audit failure rolls back its paired content write", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  db.sqlite.exec(
    "CREATE TRIGGER reject_audit BEFORE INSERT ON audit_log BEGIN SELECT RAISE(ABORT, 'test audit failure'); END",
  );
  await assert.rejects(saveAdminContent(db, admin, { kind: "event", record: event() }));
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM events").get()?.n, 0);
});

test("server permission checks cannot be bypassed by posting a published status", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const editor = { ...admin, role: "editor" as const };
  await assert.rejects(
    saveAdminContent(db, editor, { kind: "event", record: event({ status: "published" }) }),
    hasStatus(403),
  );
  const published = await saveAdminContent(db, admin, {
    kind: "event",
    record: event({ status: "published" }),
  });
  await assert.rejects(
    saveAdminContent(db, editor, { kind: "event", ...published, record: event() }),
    hasStatus(403),
  );
});

test("admin lists paginate and hide the audit feed from non-administrators", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  for (let index = 0; index < 26; index++)
    await saveAdminContent(db, admin, {
      kind: "ministry",
      record: ministry({ name: `Ministry ${index}`, slug: `ignored-${index}` }),
    });
  const page = await loadAdminContent(db, admin);
  assert.equal(page.ministries.length, 25);
  assert.equal(page.totals.ministries, 26);
  assert.equal(page.audit.length, 20);
  const next = await loadAdminContent(db, { ...admin, role: "editor" }, 1);
  assert.equal(next.ministries.length, 1);
  assert.equal(next.audit.length, 0);
});

test("HTTP denial responses are private and an email header alone grants nothing", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const request = new Request("https://church.test/api/admin/content", {
    headers: { "cf-access-authenticated-user-email": admin.email },
  });
  attachDatabase(request, db, "https://church.test");
  const response = await handleAdminContent(request);
  assert.equal(response.status, 401);
  assert.match(response.headers.get("cache-control")!, /no-store/);
  assert.match(response.headers.get("x-robots-tag")!, /noindex/);
  assert.equal((await response.json()).code, "unauthenticated");
  const method = await handleAdminContent(new Request(request.url, { method: "DELETE" }));
  assert.equal(method.status, 405);
  const csrfRequest = new Request(request.url, { method: "POST", body: "{}" });
  attachDatabase(csrfRequest, db, "https://church.test");
  const csrf = await handleAdminContent(csrfRequest);
  assert.equal(csrf.status, 403);
});

test("admin document, nested and failure responses cannot be publicly cached", () => {
  for (const path of [
    "/admin",
    "/admin/",
    "/admin/preview",
    "/api/admin/content",
    "/api/admin/missing",
  ]) {
    const response = protectAdminResponse(
      new Request(`https://church.test${path}`),
      new Response("", { status: 500 }),
    );
    assert.match(response.headers.get("cache-control")!, /private, no-store/);
    assert.match(response.headers.get("x-robots-tag")!, /noindex/);
  }
  assert.equal(
    protectAdminResponse(
      new Request("https://church.test/ministries"),
      new Response(""),
    ).headers.get("cache-control"),
    null,
  );
});

test("all responses receive baseline browser security headers", () => {
  const response = protectResponse(
    new Request("https://church.test/about"),
    new Response("", { headers: { "Content-Type": "text/html" } }),
  );
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("permissions-policy")!, /camera=\(\)/);
  assert.match(response.headers.get("strict-transport-security")!, /max-age=31536000/);
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
});

test("manual admin rollback can be reapplied without deleting content", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  await saveAdminContent(db, admin, { kind: "ministry", record: ministry() });
  for (const migration of [
    "0011_team_and_event_newsletters.down.sql",
    "0010_newsletter_templates.down.sql",
    "0009_newsletter_automatic_reconciliation.down.sql",
    "0008_newsletter_reconciliation.down.sql",
  ]) {
    db.sqlite.exec(
      readFileSync(new URL(`../migrations/rollback/${migration}`, import.meta.url), "utf8"),
    );
  }
  db.sqlite.exec(
    readFileSync(
      new URL("../migrations/rollback/0007_newsletter_delivery.down.sql", import.meta.url),
      "utf8",
    ),
  );
  db.sqlite.exec(
    readFileSync(
      new URL("../migrations/rollback/0006_newsletter_subscribers.down.sql", import.meta.url),
      "utf8",
    ),
  );
  db.sqlite.exec(
    readFileSync(
      new URL("../migrations/rollback/0005_media_assets.down.sql", import.meta.url),
      "utf8",
    ),
  );
  db.sqlite.exec(
    readFileSync(
      new URL("../migrations/rollback/0004_google_auth.down.sql", import.meta.url),
      "utf8",
    ),
  );
  db.sqlite.exec(
    readFileSync(
      new URL("../migrations/rollback/0003_password_auth.down.sql", import.meta.url),
      "utf8",
    ),
  );
  db.sqlite.exec(
    readFileSync(
      new URL("../migrations/rollback/0002_admin_access.down.sql", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM ministries").get()?.n, 1);
  assert.equal(
    db.sqlite.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='admin_users'").get()?.n,
    0,
  );
  db.sqlite.exec(
    readFileSync(new URL("../migrations/0002_admin_access.sql", import.meta.url), "utf8"),
  );
  db.bootstrap();
  assert.deepEqual(await findActiveAdmin(db, admin.email), admin);
  assert.equal(db.sqlite.prepare("SELECT revision FROM ministries").get()?.revision, 1);
});
