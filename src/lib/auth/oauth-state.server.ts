import type { SqlDatabase } from "../db/sql.types.ts";
import { digestToken, newToken, validToken, nowSeconds } from "./session.server.ts";
import { AdminError } from "./permissions.ts";

export async function startOAuthFlow(
  db: SqlDatabase,
  origin: string,
  clientId: string,
  oldBrowser: string | null,
  now = nowSeconds(),
) {
  const flow = { state: newToken(), browser: newToken(), nonce: newToken(), verifier: newToken() };
  await db.batch([
    db
      .prepare("DELETE FROM admin_oauth_states WHERE expires_at <= ? OR browser_hash = ?")
      .bind(now, validToken(oldBrowser) ? digestToken(oldBrowser!) : ""),
    db
      .prepare(
        `INSERT INTO admin_oauth_states (state_hash, browser_hash, code_verifier, nonce, auth_origin, client_id, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        digestToken(flow.state),
        digestToken(flow.browser),
        flow.verifier,
        flow.nonce,
        origin,
        clientId,
        now,
        now + 600,
      ),
  ]);
  return flow;
}

export async function consumeOAuthFlow(
  db: SqlDatabase,
  state: string | null,
  browser: string | null,
  origin: string,
  clientId: string,
  now = nowSeconds(),
) {
  const invalid = () =>
    new AdminError(400, "expired", "This sign-in attempt expired. Please start again.");
  if (!validToken(state) || !validToken(browser)) throw invalid();
  // Atomic claim: wrong browsers cannot consume it; concurrent callbacks cannot both use it.
  const row = await db
    .prepare(
      `DELETE FROM admin_oauth_states WHERE state_hash = ? AND browser_hash = ?
    AND auth_origin = ? AND client_id = ? AND expires_at > ? RETURNING code_verifier, nonce`,
    )
    .bind(digestToken(state!), digestToken(browser!), origin, clientId, now)
    .first<{ code_verifier: string; nonce: string }>();
  if (!row) throw invalid();
  return { state: state!, verifier: row.code_verifier, nonce: row.nonce };
}
