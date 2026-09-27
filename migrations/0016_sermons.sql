CREATE TABLE sermons (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  speaker TEXT NOT NULL,
  sermon_date TEXT NOT NULL,
  scripture TEXT NOT NULL,
  series TEXT,
  topic TEXT,
  youtube_url TEXT,
  audio_url TEXT,
  notes_url TEXT,
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  image_path TEXT,
  image_alt TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  seo_title TEXT,
  seo_description TEXT,
  social_image_path TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by TEXT,
  updated_by TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  CHECK (status != 'published' OR published_at IS NOT NULL),
  CHECK (status != 'published' OR youtube_url IS NOT NULL OR audio_url IS NOT NULL)
);

CREATE INDEX idx_sermons_publication
  ON sermons (status, published_at, sermon_date DESC);

CREATE INDEX idx_sermons_series
  ON sermons (series, sermon_date DESC);
