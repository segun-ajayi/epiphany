-- MANUAL DESTRUCTIVE RECOVERY ONLY. Export first; not an automatic rollback.
-- Removes credentials and sessions. Returning to Access also requires its config.
DROP TRIGGER audit_password_reset_insert;
DROP TRIGGER audit_password_reset_rotate;
DROP TABLE admin_password_resets;
DROP TABLE admin_sessions;
DROP TABLE auth_rate_limits;
ALTER TABLE admin_users DROP COLUMN password_changed_at;
ALTER TABLE admin_users DROP COLUMN auth_version;
ALTER TABLE admin_users DROP COLUMN password_hash;
