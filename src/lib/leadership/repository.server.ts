import type { SqlDatabase } from "../db/sql.types.ts";
import { mediaIdFromPath, mediaPath, type UploadedImage } from "../admin/media.server.ts";
import { AdminError, assertContentPermission, type AdminUser } from "../auth/permissions.ts";
import { contentSlug } from "../content/slug.ts";
import { saveLeaderSchema, type AdminLeader } from "./schemas.ts";

async function availableSlug(db: SqlDatabase, base: string, excludeId = "") {
  const rows = await db
    .prepare("SELECT slug FROM leaders WHERE (slug = ? OR slug LIKE ?) AND id != ? LIMIT 1001")
    .bind(base, `${base}-%`, excludeId)
    .all<{ slug: string }>();
  const used = new Set(rows.results.map((row) => row.slug));
  for (let number = 1; number <= 1000; number++) {
    const suffix = number === 1 ? "" : `-${number}`;
    const candidate = `${base.slice(0, 160 - suffix.length).replace(/-+$/g, "")}${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new AdminError(
    409,
    "slug_unavailable",
    "No available profile identifier could be generated.",
  );
}

export async function loadAdminLeaders(db: SqlDatabase) {
  const rows = await db
    .prepare(
      `SELECT id, slug, name, role, bio, email, phone, facebook_url, instagram_url,
      linkedin_url, photo_path, photo_alt, display_order, status, published_at, revision
      FROM leaders ORDER BY display_order, name`,
    )
    .all<AdminLeader>();
  return { leaders: rows.results };
}

export async function saveLeader(
  db: SqlDatabase,
  user: AdminUser,
  input: unknown,
  image: UploadedImage | null,
) {
  const mutation = saveLeaderSchema.parse(input);
  const existing = mutation.id
    ? await db
        .prepare(
          "SELECT id, slug, status, photo_path, published_at, revision FROM leaders WHERE id = ?",
        )
        .bind(mutation.id)
        .first<{
          id: string;
          slug: string;
          status: string;
          photo_path: string | null;
          published_at: string | null;
          revision: number;
        }>()
    : null;
  if (mutation.id && !existing)
    throw new AdminError(404, "not_found", "This profile no longer exists.");
  if (existing && mutation.revision !== existing.revision)
    throw new AdminError(409, "conflict", "This profile changed. Reload before saving again.");
  assertContentPermission(user, mutation.leader.status, existing?.status);

  const photoPath = image
    ? mediaPath(image.id)
    : mutation.leader.remove_photo
      ? null
      : (existing?.photo_path ?? null);
  const photoAlt = photoPath ? mutation.leader.photo_alt || mutation.leader.name : null;
  const slug = existing?.published_at
    ? existing.slug
    : await availableSlug(db, contentSlug(mutation.leader.name), existing?.id);
  const id = existing?.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const publishedAt =
    mutation.leader.status === "published"
      ? existing?.published_at || now
      : (existing?.published_at ?? null);
  const values = [
    slug,
    mutation.leader.name,
    mutation.leader.role,
    mutation.leader.bio,
    mutation.leader.email,
    mutation.leader.phone,
    mutation.leader.facebook_url,
    mutation.leader.instagram_url,
    mutation.leader.linkedin_url,
    photoPath,
    photoAlt,
    mutation.leader.display_order,
    mutation.leader.status,
    publishedAt,
  ] as const;
  const statements = [];
  if (image)
    statements.push(
      db
        .prepare(
          `INSERT INTO media_assets (id, content_type, body, byte_size, created_at, created_by)
        VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(image.id, image.contentType, image.bytes, image.byteSize, now, user.id),
    );
  statements.push(
    existing
      ? db
          .prepare(
            `UPDATE leaders SET slug=?, name=?, role=?, bio=?, email=?, phone=?, facebook_url=?,
          instagram_url=?, linkedin_url=?, photo_path=?, photo_alt=?, display_order=?, status=?,
          published_at=?, updated_at=?, updated_by=?, revision=revision+1 WHERE id=? AND revision=?`,
          )
          .bind(...values, now, user.id, id, existing.revision)
      : db
          .prepare(
            `INSERT INTO leaders (id, slug, name, role, bio, email, phone, facebook_url,
          instagram_url, linkedin_url, photo_path, photo_alt, display_order, status, published_at,
          created_at, updated_at, created_by, updated_by, revision)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          )
          .bind(id, ...values, now, now, user.id, user.id),
  );
  const oldMediaId = mediaIdFromPath(existing?.photo_path);
  if (oldMediaId && existing?.photo_path !== photoPath)
    statements.push(db.prepare("DELETE FROM media_assets WHERE id = ?").bind(oldMediaId));
  statements.push(
    db
      .prepare(
        `INSERT INTO audit_log (id, actor_id, action, content_type, record_id, summary, created_at)
      VALUES (?, ?, ?, 'leader', ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        user.id,
        existing ? "leader.update" : "leader.create",
        id,
        `Saved ${mutation.leader.name} as ${mutation.leader.status}.`,
        now,
      ),
  );
  await db.batch(statements);
  return { ok: true as const, id, slug };
}
