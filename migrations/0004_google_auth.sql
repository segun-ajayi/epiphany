ALTER TABLE admin_users ADD COLUMN google_subject TEXT;
CREATE UNIQUE INDEX idx_admin_google_subject ON admin_users(google_subject)
  WHERE google_subject IS NOT NULL;

CREATE TABLE admin_oauth_states (
  state_hash TEXT PRIMARY KEY NOT NULL,
  browser_hash TEXT NOT NULL,
  code_verifier TEXT NOT NULL,
  nonce TEXT NOT NULL,
  auth_origin TEXT NOT NULL,
  client_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_admin_oauth_expiry ON admin_oauth_states(expires_at);
CREATE INDEX idx_admin_oauth_browser ON admin_oauth_states(browser_hash);

-- Switching authentication providers invalidates all old credentials and sessions.
-- Content, roles, approved accounts and audit history are preserved. Keep a
-- protected backup before applying; rollback does not resurrect credentials.
DELETE FROM admin_sessions;
DELETE FROM admin_password_resets;
UPDATE admin_users SET password_hash = NULL, password_changed_at = NULL,
  auth_version = auth_version + 1;
