ALTER TABLE admin_users ADD COLUMN password_hash TEXT;
ALTER TABLE admin_users ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE admin_users ADD COLUMN password_changed_at TEXT;

CREATE TABLE admin_sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  auth_version INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_admin_sessions_user ON admin_sessions(user_id);
CREATE INDEX idx_admin_sessions_expiry ON admin_sessions(expires_at);

CREATE TABLE admin_password_resets (
  token_hash TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL UNIQUE REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);
CREATE INDEX idx_admin_resets_user ON admin_password_resets(user_id);
CREATE INDEX idx_admin_resets_expiry ON admin_password_resets(expires_at);

-- Owner-issued recovery must be audited even when provisioned through SQL tools.
CREATE TRIGGER audit_password_reset_insert AFTER INSERT ON admin_password_resets BEGIN
  INSERT INTO audit_log (id, actor_id, action, content_type, record_id, summary)
  VALUES (lower(hex(randomblob(16))), NEW.user_id, 'auth.recovery-issued', 'admin_user', NEW.user_id,
    'Owner issued a one-time password setup or recovery link.');
END;
CREATE TRIGGER audit_password_reset_rotate AFTER UPDATE OF token_hash ON admin_password_resets BEGIN
  INSERT INTO audit_log (id, actor_id, action, content_type, record_id, summary)
  VALUES (lower(hex(randomblob(16))), NEW.user_id, 'auth.recovery-issued', 'admin_user', NEW.user_id,
    'Owner replaced the one-time password setup or recovery link.');
END;

CREATE TABLE auth_rate_limits (
  bucket TEXT PRIMARY KEY NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL
);
CREATE INDEX idx_auth_rate_expiry ON auth_rate_limits(window_start);
