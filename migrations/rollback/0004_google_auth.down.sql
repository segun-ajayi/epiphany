-- Manual recovery only, after a verified backup and explicit approval.
-- This removes Google identity links. Old passwords/sessions are not restored.
DROP TABLE admin_oauth_states;
DROP INDEX idx_admin_google_subject;
ALTER TABLE admin_users DROP COLUMN google_subject;
