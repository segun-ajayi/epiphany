CREATE TABLE site_settings (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  settings_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL REFERENCES admin_users(id)
);
