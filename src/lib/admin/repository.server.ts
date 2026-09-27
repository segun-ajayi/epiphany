import type { SqlDatabase, SqlValue } from "../db/sql.types.ts";
import { AdminError, assertContentPermission, type AdminUser } from "../auth/permissions.ts";
import {
  eventSchema,
  ministrySchema,
  sermonSchema,
  saveEnvelopeSchema,
  type AdminEvent,
  type AdminMinistry,
  type AdminSermon,
} from "./schemas.ts";
import { contentSlug } from "../content/slug.ts";
import {
  mediaIdFromPath,
  mediaPath,
  type UploadedImage,
  type UploadedPdf,
} from "./media.server.ts";
import { eventNewsletterDocument } from "../newsletter/templates.ts";

async function availableSlug(
  db: SqlDatabase,
  table: "ministries" | "events" | "sermons",
  base: string,
  excludeId?: string,
) {
  const matches = await db
    .prepare(`SELECT slug FROM ${table} WHERE (slug = ? OR slug LIKE ?) AND id != ? LIMIT 1001`)
    .bind(base, `${base}-%`, excludeId ?? "")
    .all<{ slug: string }>();
  const used = new Set(matches.results.map((row) => row.slug));
  for (let number = 1; number <= 1000; number++) {
    const suffix = number === 1 ? "" : `-${number}`;
    const stem = base.slice(0, 160 - suffix.length).replace(/-+$/g, "");
    const candidate = `${stem}${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new AdminError(409, "slug_unavailable", "No available URL could be generated.");
}

export async function loadAdminContent(db: SqlDatabase, user: AdminUser, page = 0) {
  const limit = 25;
  const [ministries, events, sermons, totals] = await db.batch([
    db
      .prepare("SELECT * FROM ministries ORDER BY display_order, name LIMIT ? OFFSET ?")
      .bind(limit, page * limit),
    db
      .prepare("SELECT * FROM events ORDER BY starts_at DESC LIMIT ? OFFSET ?")
      .bind(limit, page * limit),
    db
      .prepare("SELECT * FROM sermons ORDER BY sermon_date DESC, title LIMIT ? OFFSET ?")
      .bind(limit, page * limit),
    db.prepare(
      "SELECT (SELECT COUNT(*) FROM ministries) AS ministries, (SELECT COUNT(*) FROM events) AS events, (SELECT COUNT(*) FROM sermons) AS sermons",
    ),
  ]);
  const audit =
    user.role === "administrator"
      ? (
          await db
            .prepare(
              "SELECT a.action, a.content_type, a.record_id, a.summary, a.created_at, u.email AS actor_email FROM audit_log a JOIN admin_users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT 20",
            )
            .all<{
              action: string;
              content_type: string;
              record_id: string;
              summary: string;
              created_at: string;
              actor_email: string;
            }>()
        ).results
      : [];
  return {
    user,
    ministries: ministries.results as AdminMinistry[],
    events: events.results as AdminEvent[],
    sermons: sermons.results as AdminSermon[],
    totals: totals.results[0] as { ministries: number; events: number; sermons: number },
    audit,
    page,
    pageSize: limit,
  };
}

export type AdminContent = Awaited<ReturnType<typeof loadAdminContent>>;

export async function saveAdminContent(
  db: SqlDatabase,
  user: AdminUser,
  body: unknown,
  uploadedImage: UploadedImage | null = null,
  uploadedNotes: UploadedPdf | null = null,
) {
  const envelope = saveEnvelopeSchema.parse(body);
  const table =
    envelope.kind === "ministry" ? "ministries" : envelope.kind === "event" ? "events" : "sermons";
  const existing = envelope.id
    ? await db
        .prepare(
          `SELECT id, slug, status, published_at, image_path, social_image_path,
                  ${table === "sermons" ? "notes_url" : "NULL AS notes_url"}, revision
             FROM ${table} WHERE id = ?`,
        )
        .bind(envelope.id)
        .first<{
          id: string;
          slug: string;
          status: string;
          published_at: string | null;
          image_path: string | null;
          social_image_path: string | null;
          notes_url: string | null;
          revision: number;
        }>()
    : null;
  if (envelope.id && !existing)
    throw new AdminError(404, "not_found", "This record no longer exists.");
  if (existing && (!envelope.revision || existing.revision !== envelope.revision)) {
    throw new AdminError(409, "conflict", "This record changed. Reload before saving again.");
  }
  if (uploadedImage && envelope.remove_image) {
    throw new AdminError(400, "invalid_image", "Choose either a replacement image or remove.");
  }
  if (uploadedNotes && envelope.remove_notes) {
    throw new AdminError(400, "invalid_pdf", "Choose either replacement notes or remove them.");
  }
  if ((uploadedNotes || envelope.remove_notes) && envelope.kind !== "sermon") {
    throw new AdminError(400, "invalid_pdf", "PDF notes are available only for sermons.");
  }

  const submitted =
    envelope.record && typeof envelope.record === "object" && !Array.isArray(envelope.record)
      ? { ...(envelope.record as Record<string, unknown>) }
      : {};
  const title = submitted[envelope.kind === "ministry" ? "name" : "title"];
  const baseSlug = contentSlug(typeof title === "string" ? title : "");
  const uploadedPath = uploadedImage ? mediaPath(uploadedImage.id) : null;
  const uploadedNotesPath = uploadedNotes ? mediaPath(uploadedNotes.id) : null;
  const prepared = {
    ...submitted,
    slug: baseSlug,
    ...(uploadedImage
      ? { image_path: uploadedPath, social_image_path: uploadedPath }
      : envelope.remove_image
        ? { image_path: null, social_image_path: null }
        : {}),
    ...(uploadedNotes
      ? { notes_url: uploadedNotesPath }
      : envelope.remove_notes
        ? { notes_url: null }
        : {}),
  };
  const validated =
    envelope.kind === "ministry"
      ? ministrySchema.parse(prepared)
      : envelope.kind === "event"
        ? eventSchema.parse(prepared)
        : sermonSchema.parse(prepared);
  const slug = existing?.published_at
    ? existing.slug
    : await availableSlug(
        db,
        table,
        contentSlug("name" in validated ? validated.name : validated.title),
        existing?.id,
      );
  const record = { ...validated, slug };
  assertContentPermission(user, record.status, existing?.status);
  const id = existing?.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const fields = {
    ...record,
    published_at:
      record.status === "published"
        ? (record.published_at ?? now)
        : (existing?.published_at ?? null),
    updated_at: now,
    updated_by: user.id,
  };
  const newsletterDocument =
    envelope.kind === "event" &&
    "title" in record &&
    record.status === "published" &&
    existing?.status !== "published"
      ? eventNewsletterDocument(eventSchema.parse(record))
      : null;
  // Keys come only from the fixed, strict schemas above; values are always bound.
  const columns = Object.keys(fields);
  const values = Object.values(fields) as SqlValue[];
  const write = existing
    ? db
        .prepare(
          `UPDATE ${table} SET ${columns.map((column) => `${column} = ?`).join(", ")}, revision = revision + 1 WHERE id = ? AND revision = ?`,
        )
        .bind(...values, id, existing.revision)
    : db
        .prepare(
          `INSERT INTO ${table} (id, created_at, created_by, ${columns.join(", ")}) VALUES (${Array(
            columns.length + 3,
          )
            .fill("?")
            .join(", ")})`,
        )
        .bind(id, now, user.id, ...values);
  const action = existing ? "content.update" : "content.create";
  const audit = db
    .prepare(
      "INSERT INTO audit_log (id, actor_id, action, content_type, record_id, summary, created_at) SELECT ?, ?, ?, ?, ?, ?, ? WHERE changes() = 1",
    )
    .bind(
      crypto.randomUUID(),
      user.id,
      action,
      envelope.kind,
      id,
      `Saved as ${record.status}.`,
      now,
    );
  const statements = [];
  if (uploadedImage) {
    statements.push(
      db
        .prepare(
          "INSERT INTO media_assets (id, content_type, body, byte_size, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(
          uploadedImage.id,
          uploadedImage.contentType,
          uploadedImage.bytes,
          uploadedImage.byteSize,
          now,
          user.id,
        ),
    );
  }
  if (uploadedNotes) {
    statements.push(
      db
        .prepare(
          "INSERT INTO media_assets (id, content_type, body, byte_size, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(
          uploadedNotes.id,
          uploadedNotes.contentType,
          uploadedNotes.bytes,
          uploadedNotes.byteSize,
          now,
          user.id,
        ),
    );
  }
  statements.push(write, audit);
  if (newsletterDocument) {
    statements.push(
      db
        .prepare(
          `INSERT INTO newsletter_campaigns
            (id, event_id, slug, template_id, subject, preheader, document_json,
             status, attempts, send_after, created_at, created_by)
           SELECT ?, ?, ?, active_template, ?, ?, ?, 'queued', 0, ?, ?, ?
           FROM newsletter_delivery_settings
           WHERE id = 1 AND event_workflow_enabled = 1
           ON CONFLICT(event_id) DO NOTHING`,
        )
        .bind(
          crypto.randomUUID(),
          id,
          record.slug,
          newsletterDocument.subject,
          newsletterDocument.preheader,
          JSON.stringify(newsletterDocument),
          fields.published_at,
          now,
          user.id,
        ),
    );
  }

  const currentNotesPath = "notes_url" in record ? record.notes_url : null;
  const previousPaths = new Set([
    existing?.image_path,
    existing?.social_image_path,
    existing?.notes_url,
  ]);
  for (const path of previousPaths) {
    const mediaId = mediaIdFromPath(path);
    if (
      !mediaId ||
      path === record.image_path ||
      path === record.social_image_path ||
      path === currentNotesPath
    )
      continue;
    statements.push(
      db
        .prepare(
          `DELETE FROM media_assets WHERE id = ?
           AND NOT EXISTS (SELECT 1 FROM ministries WHERE image_path = ? OR social_image_path = ?)
           AND NOT EXISTS (SELECT 1 FROM events WHERE image_path = ? OR social_image_path = ?)
           AND NOT EXISTS (SELECT 1 FROM sermons WHERE image_path = ? OR social_image_path = ? OR notes_url = ?)`,
        )
        .bind(mediaId, path!, path!, path!, path!, path!, path!, path!),
    );
  }

  try {
    // D1 batch is transactional: a content write and its audit record succeed together.
    const results = await db.batch(statements);
    const mediaStatementCount = Number(Boolean(uploadedImage)) + Number(Boolean(uploadedNotes));
    const writeIndex = mediaStatementCount;
    if (results[writeIndex].meta?.changes !== 1)
      throw new AdminError(409, "conflict", "This record changed. Reload before saving again.");
    const newsletterQueued = newsletterDocument
      ? results[mediaStatementCount + 2]?.meta?.changes === 1
      : false;
    return { id, revision: (existing?.revision ?? 0) + 1, newsletterQueued };
  } catch (error) {
    if (error instanceof AdminError) throw error;
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      throw new AdminError(
        409,
        "duplicate_slug",
        "The generated URL was claimed by another save. Please save again.",
      );
    }
    throw error;
  }
}
