-- Idempotent bootstrap: never re-enable or elevate an existing account on rerun.
INSERT INTO admin_users (id, email, role, active)
VALUES ('initial-administrator', 'mortalerror@gmail.com', 'administrator', 1)
ON CONFLICT DO NOTHING;

INSERT INTO audit_log (id, actor_id, action, content_type, record_id, summary)
SELECT 'initial-administrator-bootstrap', 'initial-administrator', 'admin.bootstrap',
       'admin_user', 'initial-administrator', 'Initial administrator approved by site owner.'
WHERE changes() = 1;
