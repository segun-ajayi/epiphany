CREATE TABLE contact_messages (
  id TEXT PRIMARY KEY NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  phone TEXT,
  topic TEXT NOT NULL CHECK (topic IN ('general', 'visit', 'ministry', 'prayer', 'pastoral')),
  subject TEXT,
  message TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  internal_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE INDEX idx_contact_messages_status_created
  ON contact_messages (status, created_at DESC);
CREATE INDEX idx_contact_messages_email_created
  ON contact_messages (email, created_at DESC);
