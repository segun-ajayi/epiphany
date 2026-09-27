ALTER TABLE newsletter_delivery_settings
  ADD COLUMN active_template TEXT NOT NULL DEFAULT 'heritage'
  CHECK (active_template IN ('heritage', 'sunday-light', 'evening-prayer'));

ALTER TABLE newsletter_delivery_settings ADD COLUMN template_updated_at TEXT;
ALTER TABLE newsletter_delivery_settings
  ADD COLUMN template_updated_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL;
