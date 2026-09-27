CREATE TABLE leaders (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  photo_path TEXT,
  photo_alt TEXT,
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT REFERENCES admin_users(id),
  updated_by TEXT REFERENCES admin_users(id),
  revision INTEGER NOT NULL DEFAULT 1,
  CHECK (status != 'published' OR published_at IS NOT NULL),
  CHECK (photo_path IS NOT NULL OR photo_alt IS NULL)
);

CREATE INDEX idx_leaders_publication
  ON leaders (status, published_at, display_order, name);

-- Preserve the real names and roles already shown publicly, but deliberately omit placeholder
-- email addresses and social links. Administrators can add verified details and photos later.
INSERT INTO leaders
  (id, slug, name, role, display_order, status, published_at, created_at, updated_at)
VALUES
  ('00000000-0000-4000-8000-000000000101', 'felix-orji', 'Rt. Rev. Dr. Felix Orji',
   'The Diocesan', 10, 'published', '2026-09-24T00:00:00.000Z',
   '2026-09-24T00:00:00.000Z', '2026-09-24T00:00:00.000Z'),
  ('00000000-0000-4000-8000-000000000102', 'isaac-ifedayo-olasehinde',
   'Ven. Dr. Isaac Ifedayo Olasehinde', 'The Rector', 20, 'published',
   '2026-09-24T00:00:00.000Z', '2026-09-24T00:00:00.000Z',
   '2026-09-24T00:00:00.000Z');
