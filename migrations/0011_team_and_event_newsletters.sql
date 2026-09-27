INSERT INTO newsletter_delivery_settings (id, active_provider, updated_at)
VALUES (1, 'disabled', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
ON CONFLICT(id) DO NOTHING;

ALTER TABLE newsletter_delivery_settings
  ADD COLUMN event_workflow_enabled INTEGER NOT NULL DEFAULT 1
  CHECK (event_workflow_enabled IN (0, 1));

ALTER TABLE newsletter_delivery_settings ADD COLUMN last_event_workflow_at TEXT;
ALTER TABLE newsletter_delivery_settings ADD COLUMN last_event_workflow_error TEXT;

CREATE TABLE newsletter_campaigns (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL UNIQUE REFERENCES events(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  template_id TEXT NOT NULL
    CHECK (template_id IN ('heritage', 'sunday-light', 'evening-prayer')),
  subject TEXT NOT NULL,
  preheader TEXT NOT NULL,
  document_json TEXT NOT NULL,
  provider TEXT CHECK (provider IN ('kit', 'sender')),
  status TEXT NOT NULL
    CHECK (status IN ('queued', 'creating', 'draft', 'sending', 'sent', 'failed')),
  external_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  send_after TEXT NOT NULL,
  last_attempt_at TEXT,
  last_error TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX idx_newsletter_campaign_delivery
  ON newsletter_campaigns(status, send_after, created_at);
