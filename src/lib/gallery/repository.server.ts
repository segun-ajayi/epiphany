import type { SqlDatabase } from "../db/sql.types.ts";
import { AdminError, assertContentPermission, type AdminUser } from "../auth/permissions.ts";
import { contentSlug } from "../content/slug.ts";
import { mediaIdFromPath, mediaPath, type UploadedImage } from "../admin/media.server.ts";
import {
  galleryMutationSchema,
  type AdminGalleryAlbum,
  type AdminGalleryPhoto,
} from "./schemas.ts";

async function availableAlbumSlug(db: SqlDatabase, base: string, excludeId = "") {
  const matches = await db
    .prepare(
      "SELECT slug FROM gallery_albums WHERE (slug = ? OR slug LIKE ?) AND id != ? LIMIT 1001",
    )
    .bind(base, `${base}-%`, excludeId)
    .all<{ slug: string }>();
  const used = new Set(matches.results.map((row) => row.slug));
  for (let number = 1; number <= 1000; number++) {
    const suffix = number === 1 ? "" : `-${number}`;
    const candidate = `${base.slice(0, 160 - suffix.length).replace(/-+$/g, "")}${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new AdminError(409, "slug_unavailable", "No available album URL could be generated.");
}

export async function loadAdminGallery(db: SqlDatabase) {
  const [albumsResult, photosResult] = await db.batch([
    db.prepare(`SELECT a.*, (SELECT COUNT(*) FROM gallery_photos p WHERE p.album_id = a.id) AS photo_count
                  FROM gallery_albums a ORDER BY a.display_order, a.event_date DESC, a.title`),
    db.prepare(
      "SELECT id, album_id, image_path, thumbnail_path, image_width, image_height, image_alt, caption, display_order, featured, revision FROM gallery_photos ORDER BY album_id, featured DESC, display_order, created_at",
    ),
  ]);
  const photos = photosResult.results as AdminGalleryPhoto[];
  return {
    albums: (albumsResult.results as Omit<AdminGalleryAlbum, "photos">[]).map((album) => ({
      ...album,
      photos: photos.filter((photo) => photo.album_id === album.id),
    })),
    limits: { photosPerAlbum: 100, fullImageBytes: 500_000, thumbnailBytes: 100_000 },
  };
}

export async function saveGalleryAlbum(db: SqlDatabase, user: AdminUser, input: unknown) {
  const mutation = galleryMutationSchema.parse(input);
  if (mutation.action !== "save-album")
    throw new AdminError(400, "invalid_action", "Choose a valid album action.");
  const existing = mutation.id
    ? await db
        .prepare("SELECT id, slug, status, published_at, revision FROM gallery_albums WHERE id = ?")
        .bind(mutation.id)
        .first<{
          id: string;
          slug: string;
          status: string;
          published_at: string | null;
          revision: number;
        }>()
    : null;
  if (mutation.id && !existing)
    throw new AdminError(404, "not_found", "This album no longer exists.");
  if (existing && mutation.revision !== existing.revision)
    throw new AdminError(409, "conflict", "This album changed. Reload before saving again.");
  assertContentPermission(user, mutation.album.status, existing?.status);
  if (mutation.album.status === "published") {
    const count = mutation.id
      ? await db
          .prepare("SELECT COUNT(*) AS total FROM gallery_photos WHERE album_id = ?")
          .bind(mutation.id)
          .first<{ total: number }>()
      : null;
    if (!count?.total)
      throw new AdminError(
        400,
        "photo_required",
        "Add at least one photo before publishing this album.",
      );
  }
  const base = contentSlug(mutation.album.title);
  const slug = existing?.published_at
    ? existing.slug
    : await availableAlbumSlug(db, base, existing?.id);
  const id = existing?.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const publishedAt =
    mutation.album.status === "published"
      ? mutation.album.published_at || existing?.published_at || now
      : (existing?.published_at ?? null);
  const values = [
    slug,
    mutation.album.title,
    mutation.album.summary,
    mutation.album.description,
    mutation.album.event_date,
    mutation.album.related_event_slug,
    mutation.album.related_ministry_slug,
    mutation.album.status,
    mutation.album.display_order,
    mutation.album.seo_title,
    mutation.album.seo_description,
    publishedAt,
    now,
    user.id,
  ] as const;
  const write = existing
    ? db
        .prepare(
          `UPDATE gallery_albums SET slug=?, title=?, summary=?, description=?, event_date=?,
        related_event_slug=?, related_ministry_slug=?, status=?, display_order=?, seo_title=?,
        seo_description=?, published_at=?, updated_at=?, updated_by=?, revision=revision+1
        WHERE id=? AND revision=?`,
        )
        .bind(...values, id, existing.revision)
    : db
        .prepare(
          `INSERT INTO gallery_albums
        (id, slug, title, summary, description, event_date, related_event_slug, related_ministry_slug,
         status, display_order, seo_title, seo_description, published_at, created_at, updated_at,
         created_by, updated_by, revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        )
        .bind(id, ...values.slice(0, 12), now, now, user.id, user.id);
  await db.batch([
    write,
    db
      .prepare(
        `INSERT INTO audit_log (id, actor_id, action, content_type, record_id, summary, created_at)
      VALUES (?, ?, ?, 'gallery_album', ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        user.id,
        existing ? "gallery.album-update" : "gallery.album-create",
        id,
        `Saved as ${mutation.album.status}.`,
        now,
      ),
  ]);
  return { ok: true as const, id, slug };
}

export async function addGalleryPhoto(
  db: SqlDatabase,
  user: AdminUser,
  albumId: string,
  alt: string,
  caption: string | null,
  image: UploadedImage,
  thumbnail: UploadedImage,
  width: number,
  height: number,
) {
  const album = await db
    .prepare("SELECT id FROM gallery_albums WHERE id = ?")
    .bind(albumId)
    .first<{ id: string }>();
  if (!album) throw new AdminError(404, "not_found", "This album no longer exists.");
  const count = await db
    .prepare("SELECT COUNT(*) AS total FROM gallery_photos WHERE album_id = ?")
    .bind(albumId)
    .first<{ total: number }>();
  if ((count?.total ?? 0) >= 100)
    throw new AdminError(409, "album_full", "This album has reached its 100-photo limit.");
  const imageAlt = alt.trim();
  if (imageAlt.length < 3 || imageAlt.length > 240)
    throw new AdminError(400, "invalid_alt", "Describe the photo in 3 to 240 characters.");
  const cleanCaption = caption?.trim() || null;
  if (cleanCaption && cleanCaption.length > 500)
    throw new AdminError(400, "invalid_caption", "Keep the caption under 500 characters.");
  if (image.byteSize > 500_000)
    throw new AdminError(
      413,
      "image_too_large",
      "The optimized gallery image must be under 500 KB.",
    );
  if (thumbnail.byteSize > 100_000)
    throw new AdminError(413, "thumbnail_too_large", "The gallery thumbnail must be under 100 KB.");
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 1600 ||
    height > 1600
  )
    throw new AdminError(400, "invalid_dimensions", "The optimized image dimensions are invalid.");
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        "INSERT INTO media_assets (id, content_type, body, byte_size, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(image.id, image.contentType, image.bytes, image.byteSize, now, user.id),
    db
      .prepare(
        "INSERT INTO media_assets (id, content_type, body, byte_size, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(thumbnail.id, thumbnail.contentType, thumbnail.bytes, thumbnail.byteSize, now, user.id),
    db
      .prepare(
        `INSERT INTO gallery_photos (id, album_id, image_path, thumbnail_path, image_width,
      image_height, image_alt, caption, display_order, featured, created_at, updated_at, created_by,
      updated_by, revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      )
      .bind(
        id,
        albumId,
        mediaPath(image.id),
        mediaPath(thumbnail.id),
        width,
        height,
        imageAlt,
        cleanCaption,
        count?.total ?? 0,
        count?.total ? 0 : 1,
        now,
        now,
        user.id,
        user.id,
      ),
    db
      .prepare(
        `INSERT INTO audit_log (id, actor_id, action, content_type, record_id, summary, created_at)
      VALUES (?, ?, 'gallery.photo-upload', 'gallery_photo', ?, ?, ?)`,
      )
      .bind(crypto.randomUUID(), user.id, id, `Added a photo to album ${albumId}.`, now),
  ]);
  return { ok: true as const, id };
}

export async function mutateGalleryPhoto(db: SqlDatabase, user: AdminUser, input: unknown) {
  const mutation = galleryMutationSchema.parse(input);
  if (mutation.action === "save-album")
    throw new AdminError(400, "invalid_action", "Choose a valid photo action.");
  const existing = await db
    .prepare(
      "SELECT id, album_id, image_path, thumbnail_path, revision FROM gallery_photos WHERE id = ?",
    )
    .bind(mutation.id)
    .first<{
      id: string;
      album_id: string;
      image_path: string;
      thumbnail_path: string | null;
      revision: number;
    }>();
  if (!existing) throw new AdminError(404, "not_found", "This photo no longer exists.");
  if (existing.revision !== mutation.revision)
    throw new AdminError(409, "conflict", "This photo changed. Reload before saving again.");
  const now = new Date().toISOString();
  if (mutation.action === "remove-photo") {
    const mediaId = mediaIdFromPath(existing.image_path);
    const thumbnailId = mediaIdFromPath(existing.thumbnail_path);
    const statements = [
      db
        .prepare("DELETE FROM gallery_photos WHERE id = ? AND revision = ?")
        .bind(existing.id, existing.revision),
    ];
    if (mediaId) statements.push(db.prepare("DELETE FROM media_assets WHERE id = ?").bind(mediaId));
    if (thumbnailId && thumbnailId !== mediaId)
      statements.push(db.prepare("DELETE FROM media_assets WHERE id = ?").bind(thumbnailId));
    statements.push(
      db
        .prepare(
          `INSERT INTO audit_log (id, actor_id, action, content_type, record_id, summary, created_at)
      VALUES (?, ?, 'gallery.photo-remove', 'gallery_photo', ?, 'Removed a gallery photo.', ?)`,
        )
        .bind(crypto.randomUUID(), user.id, existing.id, now),
    );
    await db.batch(statements);
    return { ok: true as const };
  }
  const statements = [];
  if (mutation.featured)
    statements.push(
      db
        .prepare("UPDATE gallery_photos SET featured = 0 WHERE album_id = ?")
        .bind(existing.album_id),
    );
  statements.push(
    db
      .prepare(
        `UPDATE gallery_photos SET image_alt=?, caption=?, display_order=?, featured=?,
    updated_at=?, updated_by=?, revision=revision+1 WHERE id=? AND revision=?`,
      )
      .bind(
        mutation.image_alt,
        mutation.caption,
        mutation.display_order,
        mutation.featured ? 1 : 0,
        now,
        user.id,
        existing.id,
        existing.revision,
      ),
  );
  statements.push(
    db
      .prepare(
        `INSERT INTO audit_log (id, actor_id, action, content_type, record_id, summary, created_at)
    VALUES (?, ?, 'gallery.photo-update', 'gallery_photo', ?, 'Updated gallery photo details.', ?)`,
      )
      .bind(crypto.randomUUID(), user.id, existing.id, now),
  );
  await db.batch(statements);
  return { ok: true as const };
}
