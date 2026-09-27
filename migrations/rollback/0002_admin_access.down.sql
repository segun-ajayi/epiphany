-- MANUAL, DESTRUCTIVE RECOVERY ONLY. Export D1 first and roll back the Worker.
-- This removes administrator roles, audit history, and content revision counters.
DROP TABLE audit_log;
DROP TABLE admin_users;
ALTER TABLE ministries DROP COLUMN revision;
ALTER TABLE events DROP COLUMN revision;
-- After recovery, reconcile the 0002 entry in d1_migrations before reapplying.
