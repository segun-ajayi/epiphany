import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { TestDatabase } from "./d1-test-adapter.ts";
import { fakeGoogle } from "./fixtures/google-provider.ts";
import { handleAuth } from "../src/lib/auth/http.server.ts";
import { attachDatabase } from "../src/lib/db/runtime.server.ts";
import type { CloudflareRuntimeRequest } from "../src/lib/db/d1.types.ts";
import { handleAdminContent } from "../src/lib/admin/http.server.ts";
import {
  createGoogleSession,
  verifySession,
  signOut,
  consumeAuthStart,
  digestToken,
  newToken,
  nowSeconds,
  SESSION_SECONDS,
} from "../src/lib/auth/session.server.ts";
import { startOAuthFlow, consumeOAuthFlow } from "../src/lib/auth/oauth-state.server.ts";
import {
  parseAuthOrigin,
  sessionCookie,
  readSessionCookie,
} from "../src/lib/auth/cookies.server.ts";
import { exportPortableData, importPortableData } from "../src/lib/db/transfer.server.ts";

const origin = "https://church.test";
const identity = {
  subject: "google-test-user",
  email: "mortalerror@gmail.com",
  authoritativeEmail: true,
};
const status = (code: number) => (error: unknown) =>
  !!error && typeof error === "object" && "status" in error && error.status === code;
function request(db: TestDatabase, action: string, options: RequestInit = {}) {
  const req = new Request(`${origin}/api/admin/auth/${action}`, {
    method: "POST",
    body: "{}",
    headers: { origin, "content-type": "application/json", "x-admin-request": "1" },
    ...options,
  });
  attachDatabase(req, db, origin);
  return req;
}
async function begin(db: TestDatabase, provider: Awaited<ReturnType<typeof fakeGoogle>>) {
  const response = await handleAuth(request(db, "google"), "google", provider.config);
  assert.equal(response.status, 200);
  const url = new URL((await response.json()).url);
  const cookie = response.headers.get("set-cookie")!.split(";")[0];
  return { url, cookie };
}
async function callback(
  db: TestDatabase,
  provider: Awaited<ReturnType<typeof fakeGoogle>>,
  url: URL,
  cookie: string,
) {
  const req = new Request(url, { headers: { cookie } });
  attachDatabase(req, db, origin);
  return handleAuth(req, "google-callback", provider.config);
}
function session(response: Response) {
  const cookie = response.headers
    .getSetCookie()
    .find((value) => value.startsWith("__Host-epiphany_session="));
  assert.ok(cookie, "Expected authenticated session cookie");
  return cookie.split(";")[0];
}

test("missing Google configuration returns a private setup notice without leaking secrets", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const req = request(db, "google") as CloudflareRuntimeRequest;
  req.runtime = {
    cloudflare: { env: { GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "private-fixture-value" } },
  };
  const response = await handleAuth(req, "google");
  assert.equal(response.status, 503);
  const body = await response.text();
  assert.match(body, /unconfigured/);
  assert.ok(!body.includes("private-fixture-value"));
  assert.match(response.headers.get("cache-control")!, /private, no-store/);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM admin_oauth_states").get()?.n, 0);
});

test("Google authorization uses minimal scope, PKCE, state, nonce and private browser binding", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const provider = await fakeGoogle();
  const { url, cookie } = await begin(db, provider);
  assert.equal(url.origin, "https://accounts.google.com");
  assert.equal(url.searchParams.get("scope"), "openid email");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("redirect_uri"), origin + "/api/admin/auth/google-callback");
  assert.equal(url.searchParams.get("access_type"), null);
  assert.ok(url.searchParams.get("state") && url.searchParams.get("nonce"));
  assert.ok(!url.href.includes("secret"));
  const row = db.sqlite.prepare("SELECT * FROM admin_oauth_states").get()!;
  assert.equal(row.state_hash, digestToken(url.searchParams.get("state")!));
  assert.equal(row.browser_hash, digestToken(cookie.split("=")[1]));
  assert.notEqual(row.state_hash, row.browser_hash);
});

test("full signed Google callback links only the approved account, authorizes content and logs out", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const provider = await fakeGoogle();
  const flow = await begin(db, provider);
  const url = provider.authorize(flow.url);
  const response = await callback(db, provider, url, flow.cookie);
  assert.equal(response.headers.get("location"), "/admin");
  assert.equal(response.status, 303);
  assert.match(response.headers.get("cache-control")!, /private, no-store/);
  const cookie = session(response);
  const contentRequest = new Request(origin + "/api/admin/content", { headers: { cookie } });
  attachDatabase(contentRequest, db, origin);
  assert.equal((await handleAdminContent(contentRequest)).status, 200);
  assert.equal(
    db.sqlite.prepare("SELECT google_subject FROM admin_users").get()?.google_subject,
    identity.subject,
  );
  assert.equal(
    db.sqlite.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action='auth.google-linked'").get()
      ?.n,
    1,
  );
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM admin_oauth_states").get()?.n, 0);
  assert.equal(
    (await callback(db, provider, url, flow.cookie)).headers.get("location"),
    "/admin?signin=expired",
  );
  assert.equal(provider.tokenRequests, 1);
  const logout = await handleAuth(
    request(db, "logout", {
      headers: { origin, "content-type": "application/json", "x-admin-request": "1", cookie },
    }),
    "logout",
  );
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie")!, /Max-Age=0/);
  assert.equal((await handleAdminContent(contentRequest)).status, 401);
});

test("signature, issuer, audience, expiry, nonce and verified-email checks fail closed", async (t) => {
  const provider = await fakeGoogle();
  for (const [name, claims, forged] of [
    ["signature", {}, true],
    ["issuer", { iss: "https://evil.test" }, false],
    ["audience", { aud: "another-client" }, false],
    ["expiry", { exp: nowSeconds() - 100 }, false],
    ["nonce", { nonce: "wrong" }, false],
    ["verified", { email_verified: false }, false],
    ["email", { email: "" }, false],
    ["subject", { sub: "" }, false],
    ["stale issuance", { iat: nowSeconds() - 900 }, false],
    ["future issuance", { iat: nowSeconds() + 900 }, false],
    ["unknown administrator", { email: "unapproved@gmail.com" }, false],
  ] as const) {
    await t.test(name, async () => {
      const db = new TestDatabase();
      try {
        const flow = await begin(db, provider);
        const response = await callback(
          db,
          provider,
          provider.authorize(flow.url, claims, forged),
          flow.cookie,
        );
        assert.notEqual(response.headers.get("location"), "/admin");
        assert.ok(
          !response.headers.getSetCookie().some((x) => x.startsWith("__Host-epiphany_session=")),
        );
        assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM admin_sessions").get()?.n, 0);
        assert.equal(
          db.sqlite.prepare("SELECT google_subject FROM admin_users").get()?.google_subject,
          null,
        );
      } finally {
        db.close();
      }
    });
  }
});

test("wrong browser, origin, client, expired and replayed states cannot be redeemed", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const flow = await startOAuthFlow(db, origin, "client-one", null, 1000);
  for (const args of [
    [flow.state, newToken(), origin, "client-one", 1001],
    [newToken(), flow.browser, origin, "client-one", 1001],
    [flow.state, flow.browser, "https://evil.test", "client-one", 1001],
    [flow.state, flow.browser, origin, "client-two", 1001],
    [flow.state, flow.browser, origin, "client-one", 1600],
  ] as const)
    await assert.rejects(consumeOAuthFlow(db, ...args), status(400));
  const results = await Promise.allSettled([
    consumeOAuthFlow(db, flow.state, flow.browser, origin, "client-one", 1001),
    consumeOAuthFlow(db, flow.state, flow.browser, origin, "client-one", 1001),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
});

test("starting again replaces the browser's prior attempt; cancellations do not authenticate", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const provider = await fakeGoogle();
  const flow = await begin(db, provider);
  const cancelled = provider.authorize(flow.url);
  cancelled.searchParams.delete("code");
  cancelled.searchParams.set("error", "access_denied");
  assert.equal(
    (await callback(db, provider, cancelled, flow.cookie)).headers.get("location"),
    "/admin?signin=cancelled",
  );
  assert.equal(provider.tokenRequests, 0);
  const one = await startOAuthFlow(db, origin, "client", null);
  await startOAuthFlow(db, origin, "client", one.browser);
  await assert.rejects(consumeOAuthFlow(db, one.state, one.browser, origin, "client"), status(400));
});

test("malformed callback, forged identity headers, cross-origin starts and retired password endpoints grant nothing", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const provider = await fakeGoogle();
  for (const headers of [
    { origin: "https://evil.test", "content-type": "application/json", "x-admin-request": "1" },
    { origin, "content-type": "application/json" },
    { origin, "content-type": "text/plain", "x-admin-request": "1" },
    {
      origin,
      "content-type": "application/json",
      "x-admin-request": "1",
      "sec-fetch-site": "cross-site",
    },
  ])
    assert.equal(
      (await handleAuth(request(db, "google", { headers }), "google", provider.config)).status,
      403,
    );
  for (const action of ["login", "reset-password", "change-password", "register"])
    assert.equal((await handleAuth(request(db, action), action)).status, 404);
  assert.equal(
    (
      await handleAuth(
        request(db, "google", { method: "GET", body: undefined }),
        "google",
        provider.config,
      )
    ).status,
    405,
  );
  assert.equal(
    (
      await handleAuth(
        request(db, "google", {
          body: JSON.stringify({ email: identity.email, sub: identity.subject }),
        }),
        "google",
        provider.config,
      )
    ).status,
    400,
  );
  const flow = await begin(db, provider);
  const url = provider.authorize(flow.url);
  url.searchParams.append("state", "forged");
  assert.equal(
    (await callback(db, provider, url, flow.cookie)).headers.get("location"),
    "/admin?signin=expired",
  );
  assert.equal(provider.tokenRequests, 0);
  const forged = new Request(origin + "/api/admin/content", {
    headers: {
      "x-google-email": identity.email,
      "cf-access-authenticated-user-email": identity.email,
      authorization: "Bearer fake",
    },
  });
  attachDatabase(forged, db, origin);
  assert.equal((await handleAdminContent(forged)).status, 401);
});

test("identity linking rejects unapproved, disabled, conflicting and non-authoritative email accounts", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  await assert.rejects(
    createGoogleSession(db, { ...identity, email: "other@gmail.com" }),
    status(403),
  );
  await assert.rejects(
    createGoogleSession(db, { ...identity, authoritativeEmail: false }),
    status(403),
  );
  const first = await createGoogleSession(db, identity);
  await assert.rejects(
    createGoogleSession(db, { ...identity, subject: "different-google-user" }),
    status(403),
  );
  // Stable Google subject survives an email change; approved app role/email do not change.
  const second = await createGoogleSession(db, {
    ...identity,
    email: "changed@example.com",
    authoritativeEmail: false,
  });
  assert.equal(second.user.email, identity.email);
  assert.equal(
    db.sqlite.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action='auth.google-linked'").get()
      ?.n,
    1,
  );
  db.sqlite.exec("UPDATE admin_users SET active=0");
  await assert.rejects(createGoogleSession(db, identity), status(403));
  await assert.rejects(verifySession(db, first.token), status(401));
});

test("session expiry, current roles, credential revocation and logout are enforced", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const { token } = await createGoogleSession(db, identity);
  assert.equal(token.length, 43);
  assert.equal(
    db.sqlite.prepare("SELECT token_hash FROM admin_sessions").get()?.token_hash,
    digestToken(token),
  );
  await assert.rejects(verifySession(db, token, nowSeconds() + SESSION_SECONDS + 1), status(401));
  await assert.rejects(verifySession(db, "forged"), status(401));
  db.sqlite.exec("UPDATE admin_users SET role='editor'");
  assert.equal((await verifySession(db, token)).role, "editor");
  db.sqlite.exec("UPDATE admin_users SET auth_version=auth_version+1");
  await assert.rejects(verifySession(db, token), status(401));
  const second = await createGoogleSession(db, identity);
  await signOut(db, second.token);
  await assert.rejects(verifySession(db, second.token), status(401));
});

test("concurrent linking or an audit failure cannot create an unauthorized session", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const results = await Promise.allSettled([
    createGoogleSession(db, identity),
    createGoogleSession(db, { ...identity, subject: "competing-subject" }),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  const other = new TestDatabase();
  t.after(() => other.close());
  other.sqlite.exec(
    "CREATE TRIGGER reject_audit BEFORE INSERT ON audit_log BEGIN SELECT RAISE(ABORT, 'fixture failure'); END",
  );
  await assert.rejects(createGoogleSession(other, identity));
  assert.equal(
    other.sqlite.prepare("SELECT google_subject FROM admin_users").get()?.google_subject,
    null,
  );
  assert.equal(other.sqlite.prepare("SELECT COUNT(*) AS n FROM admin_sessions").get()?.n, 0);
  const revoked = new TestDatabase();
  t.after(() => revoked.close());
  revoked.beforeBatch = () => revoked.sqlite.exec("UPDATE admin_users SET active=0");
  await assert.rejects(createGoogleSession(revoked, identity), status(403));
  assert.equal(revoked.sqlite.prepare("SELECT COUNT(*) AS n FROM admin_sessions").get()?.n, 0);
});

test("persisted start throttles reset after the window and cookies are origin-restricted", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  for (let i = 0; i < 100; i++) await consumeAuthStart(db, 1000);
  await assert.rejects(consumeAuthStart(db, 1001), status(429));
  await consumeAuthStart(db, 1900);
  const cookie = sessionCookie(newToken(), origin);
  for (const attribute of ["__Host-", "Secure", "HttpOnly", "SameSite=Lax", "Path=/"])
    assert.ok(cookie.includes(attribute));
  assert.ok(!cookie.includes("Domain="));
  const duplicate = new Request(origin, {
    headers: { cookie: "__Host-epiphany_session=a; __Host-epiphany_session=b" },
  });
  assert.equal(readSessionCookie(duplicate, origin), null);
  assert.throws(() => parseAuthOrigin(undefined, new Request(origin)), status(503));
  assert.throws(() => parseAuthOrigin("http://church.test", new Request(origin)), status(503));
  assert.equal(
    parseAuthOrigin(undefined, new Request("http://127.0.0.1:8080")),
    "http://127.0.0.1:8080",
  );
});

test("Google migration invalidates legacy passwords, sessions and recovery without deleting accounts or audit", (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  db.sqlite.exec(
    readFileSync(
      new URL("../migrations/rollback/0004_google_auth.down.sql", import.meta.url),
      "utf8",
    ),
  );
  db.sqlite.exec(
    "UPDATE admin_users SET password_hash='legacy-private-hash'; INSERT INTO admin_sessions VALUES ('old-session','initial-administrator',1,1,9999999999); INSERT INTO admin_password_resets (token_hash,user_id,created_at,expires_at) VALUES ('old-reset','initial-administrator',1,9999999999)",
  );
  const auditCount = db.sqlite.prepare("SELECT COUNT(*) AS n FROM audit_log").get()?.n;
  db.sqlite.exec(
    readFileSync(new URL("../migrations/0004_google_auth.sql", import.meta.url), "utf8"),
  );
  assert.equal(
    db.sqlite.prepare("SELECT password_hash FROM admin_users").get()?.password_hash,
    null,
  );
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM admin_sessions").get()?.n, 0);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM admin_password_resets").get()?.n, 0);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM audit_log").get()?.n, auditCount);
});

test("portable export preserves Google identities and roles but excludes passwords, sessions and OAuth secrets", async (t) => {
  const source = new TestDatabase();
  t.after(() => source.close());
  await createGoogleSession(source, identity);
  await startOAuthFlow(source, origin, "client", null);
  source.sqlite
    .prepare(
      "INSERT INTO media_assets (id, content_type, body, byte_size, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(
      "00000000-0000-4000-8000-000000000001",
      "image/webp",
      Uint8Array.of(0x52, 0x49, 0x46, 0x46),
      4,
      new Date().toISOString(),
      "initial-administrator",
    );
  source.sqlite
    .prepare(
      `INSERT INTO newsletter_subscribers
        (id, email, name, status, consent_at, consent_version, source, created_at, updated_at)
       VALUES (?, ?, ?, 'subscribed', ?, ?, 'homepage', ?, ?)`,
    )
    .run(
      "00000000-0000-4000-8000-000000000002",
      "reader@example.com",
      "Reader",
      new Date().toISOString(),
      "2026-09-05",
      new Date().toISOString(),
      new Date().toISOString(),
    );
  const payload = await exportPortableData(source);
  assert.equal(payload.schemaVersion, 11);
  assert.ok(!JSON.stringify(payload).includes("password_hash"));
  assert.equal(payload.tables.admin_users[0].google_subject, identity.subject);
  assert.equal(payload.tables.media_assets[0].body_hex, "52494646");
  assert.equal(payload.tables.newsletter_subscribers[0].email, "reader@example.com");
  const target = new TestDatabase(false);
  t.after(() => target.close());
  await importPortableData(target, payload);
  assert.equal((await createGoogleSession(target, identity)).user.email, identity.email);
  assert.equal(
    target.sqlite.prepare("SELECT hex(body) AS value FROM media_assets").get()?.value,
    "52494646",
  );
  assert.equal(
    target.sqlite.prepare("SELECT email FROM newsletter_subscribers").get()?.email,
    "reader@example.com",
  );
  await assert.rejects(importPortableData(target, payload), /empty database/);
  const legacy = new TestDatabase(false);
  t.after(() => legacy.close());
  const {
    media_assets: _mediaAssets,
    newsletter_subscribers: _newsletterSubscribers,
    ...legacyTables
  } = payload.tables;
  await importPortableData(legacy, {
    ...payload,
    schemaVersion: 3,
    tables: {
      ...legacyTables,
      admin_users: payload.tables.admin_users.map((row) => ({
        ...row,
        password_hash: "retired-hash",
        password_changed_at: "old",
      })),
    },
  });
  assert.equal(
    legacy.sqlite.prepare("SELECT password_hash FROM admin_users").get()?.password_hash,
    null,
  );
  assert.equal(
    legacy.sqlite.prepare("SELECT google_subject FROM admin_users").get()?.google_subject,
    null,
  );
});
