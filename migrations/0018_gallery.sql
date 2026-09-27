CREATE TABLE gallery_albums (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TEXT,
  related_event_slug TEXT,
  related_ministry_slug TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  seo_title TEXT,
  seo_description TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES admin_users(id),
  updated_by TEXT NOT NULL REFERENCES admin_users(id),
  revision INTEGER NOT NULL DEFAULT 1,
  CHECK (status != 'published' OR published_at IS NOT NULL)
);

CREATE TABLE gallery_photos (
  id TEXT PRIMARY KEY NOT NULL,
  album_id TEXT NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  image_alt TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES admin_users(id),
  updated_by TEXT NOT NULL REFERENCES admin_users(id),
  revision INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_gallery_albums_publication
  ON gallery_albums (status, published_at, display_order, event_date DESC);
CREATE INDEX idx_gallery_photos_album
  ON gallery_photos (album_id, featured DESC, display_order, created_at);
