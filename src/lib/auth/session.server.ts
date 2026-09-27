import { createHash, randomBytes } from "node:crypto";
import type { SqlDatabase } from "../db/sql.types.ts";
import { ADMIN_ROLES, AdminError, type AdminUser } from "./permissions.ts";
import type { GoogleIdentity } from "./google.server.ts";

export const SESSION_SECONDS = 8 * 60 * 60;
export const nowSeconds = () => Math.floor(Date.now() / 1000);
export const digestToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
export const validToken = (token: string | null) =>
  token !== null && /^[A-Za-z0-9_-]{43}$/.test(token);
const forbidden = () =>
  new AdminError(403, "forbidden", "This account does not have administrator-area access.");
const invalidSession = () => new AdminError(401, "unauthenticated", "Please sign in to continue.");

export async function findActiveAdmin(database: SqlDatabase, email: string): Promise<AdminUser> {
  const user = await database
    .prepare(
      "SELECT id, email, role FROM admin_users WHERE email = ? COLLATE NOCASE AND active = 1",
    )
    .bind(email.trim().toLowerCase())
    .first<AdminUser>();
  if (!user || !ADMIN_ROLES.includes(user.role)) throw forbidden();
  return user;
}

export async function consumeAuthStart(database: SqlDatabase, now = nowSeconds()) {
  // One persisted bucket bounds pending flows without trusting forwarding headers or storing IPs.
  const row = await database
    .prepare(
      `INSERT INTO auth_rate_limits (bucket, window_start, attempts) VALUES ('google-start', ?, 1)
    ON CONFLICT(bucket) DO UPDATE SET
    attempts = CASE WHEN window_start <= ? THEN 1 ELSE attempts + 1 END,
    window_start = CASE WHEN window_start <= ? THEN excluded.window_start ELSE window_start END
    RETURNING attempts`,
    )
    .bind(now, now - 900, now - 900)
    .first<{ attempts: number }>();
  if (!row || row.attempts > 100)
    throw new AdminError(
      429,
      "rate_limited",
      "Too many sign-in attempts. Please try again in 15 minutes.",
    );
}

// Server-only: identity must come from verified Google claims, never an HTTP body/header.
export async function createGoogleSession(database: SqlDatabase, identity: GoogleIdentity) {
  type Account = AdminUser & { google_subject: string | null; auth_version: number };
  const columns = "id, email, role, google_subject, auth_version";
  let user = await database
    .prepare(`SELECT ${columns} FROM admin_users WHERE google_subject = ? AND active = 1`)
    .bind(identity.subject)
    .first<Account>();
  if (!user && identity.authoritativeEmail)
    user = await database
      .prepare(
        `SELECT ${columns} FROM admin_users WHERE email = ? COLLATE NOCASE AND google_subject IS NULL AND active = 1`,
      )
      .bind(identity.email)
      .first<Account>();
  if (!user || !ADMIN_ROLES.includes(user.role)) throw forbidden();
  const token = newToken();
  const hash = digestToken(token);
  const now = nowSeconds();
  const results = await database.batch([
    database
      .prepare(
        `UPDATE admin_users SET google_subject = ?, updated_at = ? WHERE id = ? AND active = 1
      AND auth_version = ? AND (google_subject IS NULL OR google_subject = ?)`,
      )
      .bind(
        identity.subject,
        new Date().toISOString(),
        user.id,
        user.auth_version,
        identity.subject,
      ),
    database
      .prepare(
        `INSERT INTO admin_sessions (token_hash, user_id, auth_version, created_at, expires_at)
      SELECT ?, id, auth_version, ?, ? FROM admin_users WHERE id = ? AND active = 1 AND auth_version = ?
      AND google_subject = ? AND changes() = 1`,
      )
      .bind(hash, now, now + SESSION_SECONDS, user.id, user.auth_version, identity.subject),
    database
      .prepare(
        `INSERT INTO audit_log (id, actor_id, action, content_type, record_id, summary)
      SELECT ?, ?, 'auth.google-linked', 'admin_user', ?, 'Approved account linked to Google identity.'
      WHERE ? = 1 AND EXISTS (SELECT 1 FROM admin_sessions WHERE token_hash = ?)`,
      )
      .bind(crypto.randomUUID(), user.id, user.id, user.google_subject === null ? 1 : 0, hash),
    database
      .prepare(
        `INSERT INTO audit_log (id, actor_id, action, content_type, record_id, summary)
      SELECT ?, ?, 'auth.login', 'admin_user', ?, 'Signed in with Google.'
      WHERE EXISTS (SELECT 1 FROM admin_sessions WHERE token_hash = ?)`,
      )
      .bind(crypto.randomUUID(), user.id, user.id, hash),
    database.prepare("DELETE FROM admin_sessions WHERE expires_at <= ?").bind(now),
  ]);
  if (results[1].meta?.changes !== 1) throw forbidden();
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

export async function verifySession(
  database: SqlDatabase,
  token: string | null,
  now = nowSeconds(),
): Promise<AdminUser> {
  if (!validToken(token)) throw invalidSession();
  const user = await database
    .prepare(
      `SELECT u.id, u.email, u.role FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND s.auth_version = u.auth_version
    AND u.active = 1 AND u.google_subject IS NOT NULL`,
    )
    .bind(digestToken(token!), now)
    .first<AdminUser>();
  if (!user || !ADMIN_ROLES.includes(user.role)) throw invalidSession();
  return user;
}

export async function signOut(database: SqlDatabase, token: string | null) {
  if (!validToken(token)) return;
  await database
    .prepare("DELETE FROM admin_sessions WHERE token_hash = ?")
    .bind(digestToken(token!))
    .run();
}
