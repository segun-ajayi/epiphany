CREATE TABLE event_registrations (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  phone TEXT,
  party_size INTEGER NOT NULL CHECK (party_size BETWEEN 1 AND 20),
  note TEXT,
  consent_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended')),
  internal_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (event_id, email)
);

CREATE INDEX idx_event_registrations_event_status
  ON event_registrations (event_id, status, created_at);
