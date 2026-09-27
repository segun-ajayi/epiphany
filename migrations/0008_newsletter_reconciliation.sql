ALTER TABLE newsletter_provider_sync ADD COLUMN last_reconciled_at TEXT;
ALTER TABLE newsletter_provider_sync ADD COLUMN last_reconcile_error TEXT;

CREATE INDEX idx_newsletter_provider_reconciliation
  ON newsletter_provider_sync(provider, last_reconciled_at);
