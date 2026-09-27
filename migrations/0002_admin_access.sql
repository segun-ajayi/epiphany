CREATE TABLE admin_users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('editor', 'publisher', 'administrator')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  actor_id TEXT NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL,
  content_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_audit_created_at ON audit_log (created_at DESC);
ALTER TABLE ministries ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE events ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
