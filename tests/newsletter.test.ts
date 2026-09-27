import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminUser } from "../src/lib/auth/permissions.ts";
import { attachDatabase } from "../src/lib/db/runtime.server.ts";
import {
  exportNewsletterCsv,
  loadNewsletterSubscribers,
  subscribeToNewsletter,
  updateNewsletterStatus,
} from "../src/lib/newsletter/repository.server.ts";
import {
  handleAdminNewsletter,
  handleNewsletterSignup,
} from "../src/lib/newsletter/http.server.ts";
import { newsletterSignupSchema } from "../src/lib/newsletter/schemas.ts";
import { digestToken, newToken, nowSeconds } from "../src/lib/auth/session.server.ts";
import { TestDatabase } from "./d1-test-adapter.ts";

const origin = "https://church.test";
const admin: AdminUser = {
  id: "initial-administrator",
  email: "mortalerror@gmail.com",
  role: "administrator",
};
const signup = (overrides = {}) => ({
  name: "Parish Reader",
  email: "Reader@Example.com",
  consent: true,
  website: "",
  startedAt: Date.now() - 2000,
  ...overrides,
});

function publicRequest(db: TestDatabase, input: unknown, headers = {}) {
  const request = new Request(`${origin}/api/newsletter`, {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      "x-newsletter-request": "1",
      ...headers,
    },
    body: JSON.stringify(input),
  });
  attachDatabase(request, db, origin);
  return request;
}

function adminRequest(db: TestDatabase, url: string, options: RequestInit = {}) {
  const token = newToken();
  const now = nowSeconds();
  const { headers, ...requestOptions } = options;
  db.sqlite.exec("UPDATE admin_users SET google_subject = 'newsletter-test-subject'");
  db.sqlite
    .prepare(
      `INSERT INTO admin_sessions
        (token_hash, user_id, auth_version, created_at, expires_at)
       SELECT ?, id, auth_version, ?, ? FROM admin_users`,
    )
    .run(digestToken(token), now, now + 600);
  const request = new Request(url, {
    ...requestOptions,
    headers: { cookie: `__Host-epiphany_session=${token}`, ...headers },
  });
  attachDatabase(request, db, origin);
  return request;
}

test("newsletter schema normalizes email and requires explicit consent", () => {
  assert.equal(newsletterSignupSchema.parse(signup()).email, "reader@example.com");
  assert.equal(newsletterSignupSchema.safeParse(signup({ consent: false })).success, false);
  assert.equal(newsletterSignupSchema.safeParse(signup({ email: "not-an-email" })).success, false);
  assert.equal(newsletterSignupSchema.safeParse(signup({ extra: "field" })).success, false);
});

test("signups are duplicate-safe and an unsubscribed reader can opt in again", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  await subscribeToNewsletter(db, signup());
  await subscribeToNewsletter(db, signup({ name: "Updated Name", email: "reader@example.com" }));
  const saved = db.sqlite
    .prepare("SELECT email, name, status FROM newsletter_subscribers")
    .get() as { email: string; name: string; status: string };
  assert.equal(saved.email, "reader@example.com");
  assert.equal(saved.name, "Updated Name");
  assert.equal(saved.status, "subscribed");
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM newsletter_subscribers").get()?.n, 1);
});

test("public signup enforces origin, timing and size while silently discarding bot traps", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const success = await handleNewsletterSignup(publicRequest(db, signup()));
  assert.equal(success.status, 200, await success.clone().text());
  assert.match((await success.json()).message, /recorded/);

  const bot = await handleNewsletterSignup(
    publicRequest(db, signup({ email: "bot@example.com", website: "spam.example" })),
  );
  assert.equal(bot.status, 200);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM newsletter_subscribers").get()?.n, 1);
  assert.equal(
    (await handleNewsletterSignup(publicRequest(db, signup(), { origin: "https://evil.test" })))
      .status,
    403,
  );
  assert.equal(
    (await handleNewsletterSignup(publicRequest(db, signup({ startedAt: Date.now() })))).status,
    400,
  );
  assert.equal(
    (await handleNewsletterSignup(publicRequest(db, signup({ name: "x".repeat(9000) })))).status,
    413,
  );
});

test("subscriber management is administrator-only, audited and CSV-safe", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  await subscribeToNewsletter(db, signup({ name: "=Unsafe Formula" }));
  const loaded = await loadNewsletterSubscribers(db, admin);
  assert.equal(loaded.totals.subscribed, 1);
  await assert.rejects(
    loadNewsletterSubscribers(db, { ...admin, role: "publisher" }),
    (error: unknown) =>
      !!error && typeof error === "object" && "status" in error && error.status === 403,
  );
  await updateNewsletterStatus(db, admin, {
    id: loaded.subscribers[0].id,
    status: "unsubscribed",
  });
  assert.equal((await loadNewsletterSubscribers(db, admin)).totals.unsubscribed, 1);
  assert.equal(
    db.sqlite
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'newsletter.status'")
      .get()?.n,
    1,
  );
  await updateNewsletterStatus(db, admin, {
    id: loaded.subscribers[0].id,
    status: "subscribed",
  });
  const csv = await exportNewsletterCsv(db, admin);
  assert.match(csv, /reader@example\.com/);
  assert.match(csv, /'=Unsafe Formula/);
  assert.ok(!csv.includes(loaded.subscribers[0].id));
});

test("newsletter admin HTTP responses require a real session and remain private", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  await subscribeToNewsletter(db, signup());
  const denied = new Request(`${origin}/api/admin/newsletter`);
  attachDatabase(denied, db, origin);
  assert.equal((await handleAdminNewsletter(denied)).status, 401);

  const response = await handleAdminNewsletter(
    adminRequest(db, `${origin}/api/admin/newsletter?format=csv`),
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type")!, /text\/csv/);
  assert.match(response.headers.get("cache-control")!, /no-store/);
  assert.match(response.headers.get("content-disposition")!, /epiphany-newsletter/);

  const subscriber = db.sqlite
    .prepare("SELECT id FROM newsletter_subscribers WHERE email = ?")
    .get("reader@example.com") as { id: string };
  const statusResponse = await handleAdminNewsletter(
    adminRequest(db, `${origin}/api/admin/newsletter`, {
      method: "PATCH",
      headers: {
        origin,
        "content-type": "application/json",
        "x-admin-request": "1",
      },
      body: JSON.stringify({
        action: "subscriber-status",
        id: subscriber.id,
        status: "unsubscribed",
      }),
    }),
  );
  assert.equal(statusResponse.status, 200, await statusResponse.clone().text());
  assert.equal(
    db.sqlite.prepare("SELECT status FROM newsletter_subscribers WHERE id = ?").get(subscriber.id)
      ?.status,
    "unsubscribed",
  );
});
