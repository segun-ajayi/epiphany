PRAGMA foreign_keys = ON;

CREATE TABLE ministries (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  meeting_schedule TEXT,
  leader_name TEXT,
  contact_email TEXT,
  audience TEXT,
  image_path TEXT,
  image_alt TEXT,
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  seo_title TEXT,
  seo_description TEXT,
  social_image_path TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by TEXT,
  updated_by TEXT,
  CHECK (status != 'published' OR published_at IS NOT NULL)
);

CREATE INDEX idx_ministries_publication
  ON ministries (status, published_at, display_order);

CREATE TABLE events (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Chicago',
  venue_name TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  locality TEXT,
  region TEXT,
  postal_code TEXT,
  country_code TEXT NOT NULL DEFAULT 'US',
  registration_status TEXT NOT NULL DEFAULT 'not_required'
    CHECK (registration_status IN ('not_required', 'closed', 'open', 'full')),
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  contact_name TEXT,
  contact_email TEXT,
  image_path TEXT,
  image_alt TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'cancelled', 'archived')),
  seo_title TEXT,
  seo_description TEXT,
  social_image_path TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by TEXT,
  updated_by TEXT,
  CHECK (ends_at IS NULL OR ends_at >= starts_at),
  CHECK (status != 'published' OR published_at IS NOT NULL)
);

CREATE INDEX idx_events_publication
  ON events (status, published_at, starts_at);

CREATE INDEX idx_events_category
  ON events (category, starts_at);
