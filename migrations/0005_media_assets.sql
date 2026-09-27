CREATE TABLE media_assets (
  id TEXT PRIMARY KEY NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  body BLOB NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size > 0 AND byte_size <= 1250000),
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES admin_users(id)
);

CREATE INDEX idx_media_assets_created_at ON media_assets(created_at);
