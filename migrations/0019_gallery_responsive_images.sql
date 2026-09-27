ALTER TABLE gallery_photos ADD COLUMN thumbnail_path TEXT;
ALTER TABLE gallery_photos ADD COLUMN image_width INTEGER CHECK (image_width IS NULL OR image_width > 0);
ALTER TABLE gallery_photos ADD COLUMN image_height INTEGER CHECK (image_height IS NULL OR image_height > 0);
