CREATE TABLE newsletter_delivery_settings (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  active_provider TEXT NOT NULL CHECK (active_provider IN ('disabled', 'kit', 'sender')),
  updated_at TEXT NOT NULL,
  updated_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE TABLE newsletter_provider_sync (
  subscriber_id TEXT NOT NULL REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('kit', 'sender')),
  external_id TEXT,
  remote_status TEXT,
  last_attempt_at TEXT NOT NULL,
  last_synced_at TEXT,
  last_error TEXT,
  PRIMARY KEY (subscriber_id, provider)
);

CREATE INDEX idx_newsletter_provider_sync_provider
  ON newsletter_provider_sync(provider, last_synced_at, last_attempt_at);
