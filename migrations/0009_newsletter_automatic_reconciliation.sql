ALTER TABLE newsletter_delivery_settings
  ADD COLUMN auto_reconcile_enabled INTEGER NOT NULL DEFAULT 1
  CHECK (auto_reconcile_enabled IN (0, 1));
ALTER TABLE newsletter_delivery_settings ADD COLUMN last_auto_reconcile_at TEXT;
ALTER TABLE newsletter_delivery_settings ADD COLUMN last_auto_reconcile_error TEXT;
