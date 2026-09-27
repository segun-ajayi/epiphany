CREATE TABLE media_assets_with_pdf (
  id TEXT PRIMARY KEY NOT NULL,
  content_type TEXT NOT NULL
    CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  body BLOB NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size > 0 AND byte_size <= 1250000),
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES admin_users(id)
);

INSERT INTO media_assets_with_pdf (id, content_type, body, byte_size, created_at, created_by)
SELECT id, content_type, body, byte_size, created_at, created_by FROM media_assets;

DROP INDEX idx_media_assets_created_at;
DROP TABLE media_assets;
ALTER TABLE media_assets_with_pdf RENAME TO media_assets;
CREATE INDEX idx_media_assets_created_at ON media_assets(created_at);
