CREATE TABLE giving_settings (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  configured INTEGER NOT NULL DEFAULT 0 CHECK (configured IN (0, 1)),
  public_name TEXT NOT NULL DEFAULT '',
  legal_name TEXT NOT NULL DEFAULT '',
  tax_status_text TEXT NOT NULL DEFAULT '',
  public_ein TEXT NOT NULL DEFAULT '',
  support_email TEXT NOT NULL DEFAULT '',
  support_phone TEXT NOT NULL DEFAULT '',
  receipt_turnaround TEXT NOT NULL DEFAULT '',
  trust_statement TEXT NOT NULL DEFAULT '',
  offline_instructions TEXT NOT NULL DEFAULT '',
  annual_report_url TEXT NOT NULL DEFAULT '',
  social_image_path TEXT NOT NULL DEFAULT '',
  privacy_text TEXT NOT NULL DEFAULT '',
  receipt_consent_text TEXT NOT NULL DEFAULT '',
  retention_text TEXT NOT NULL DEFAULT '',
  receipts_enabled INTEGER NOT NULL DEFAULT 0 CHECK (receipts_enabled IN (0, 1)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at TEXT NOT NULL,
  updated_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE TABLE giving_methods (
  id TEXT PRIMARY KEY NOT NULL CHECK (id IN ('zelle', 'cash_app')),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  payment_identifier TEXT NOT NULL DEFAULT '',
  recipient_name TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  memo_guidance TEXT NOT NULL DEFAULT '',
  external_url TEXT NOT NULL DEFAULT '',
  qr_image_path TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  updated_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE TABLE giving_designations (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE TABLE giving_impact_items (
  id TEXT PRIMARY KEY NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  statement TEXT NOT NULL,
  evidence_note TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  display_order INTEGER NOT NULL DEFAULT 0,
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE TABLE giving_receipt_requests (
  id TEXT PRIMARY KEY NOT NULL,
  donor_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('zelle', 'cash_app')),
  gift_date TEXT NOT NULL,
  designation TEXT NOT NULL DEFAULT '',
  transaction_reference TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  consent_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'give-page',
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'matched', 'receipt_issued', 'unable_to_match')),
  internal_note TEXT NOT NULL DEFAULT '',
  matched_at TEXT,
  matched_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  receipt_issued_at TEXT,
  receipt_issued_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_giving_receipts_status_created
  ON giving_receipt_requests(status, created_at DESC);
CREATE INDEX idx_giving_receipts_email_created
  ON giving_receipt_requests(donor_email, created_at DESC);
