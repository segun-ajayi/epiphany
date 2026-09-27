import { AdminError, type AdminUser } from "../auth/permissions.ts";
import type { SqlDatabase } from "../db/sql.types.ts";
import { mediaPath, type UploadedImage } from "../admin/media.server.ts";
import { DEFAULT_SITE_SETTINGS } from "./defaults.ts";
import { siteSettingsMutationSchema, siteSettingsSchema, type SiteSettings } from "./schemas.ts";

type SettingsRow = { settings_json: string; revision: number };

function completeSettings(stored: Partial<SiteSettings>, revision: number) {
  const storedPages = stored.pages as Partial<SiteSettings["pages"]> | undefined;
  return siteSettingsSchema.parse({
    ...DEFAULT_SITE_SETTINGS,
    ...stored,
    home: { ...DEFAULT_SITE_SETTINGS.home, ...(stored.home || {}) },
    about: { ...DEFAULT_SITE_SETTINGS.about, ...(stored.about || {}) },
    visit: { ...DEFAULT_SITE_SETTINGS.visit, ...(stored.visit || {}) },
    pages: {
      ...DEFAULT_SITE_SETTINGS.pages,
      ...(storedPages || {}),
      ministries: {
        ...DEFAULT_SITE_SETTINGS.pages.ministries,
        ...(storedPages?.ministries || {}),
      },
      events: { ...DEFAULT_SITE_SETTINGS.pages.events, ...(storedPages?.events || {}) },
      sermons: { ...DEFAULT_SITE_SETTINGS.pages.sermons, ...(storedPages?.sermons || {}) },
      gallery: { ...DEFAULT_SITE_SETTINGS.pages.gallery, ...(storedPages?.gallery || {}) },
      contact: { ...DEFAULT_SITE_SETTINGS.pages.contact, ...(storedPages?.contact || {}) },
      give: { ...DEFAULT_SITE_SETTINGS.pages.give, ...(storedPages?.give || {}) },
    },
    revision,
  });
}

function assertAdministrator(user: AdminUser) {
  if (user.role !== "administrator")
    throw new AdminError(403, "forbidden", "Only administrators may manage site settings.");
}

export async function loadSiteSettings(db: SqlDatabase): Promise<SiteSettings> {
  try {
    const row = await db
      .prepare("SELECT settings_json, revision FROM site_settings WHERE id = 1")
      .first<SettingsRow>();
    if (!row) return DEFAULT_SITE_SETTINGS;
    const stored = JSON.parse(row.settings_json) as Partial<SiteSettings>;
    return completeSettings(stored, row.revision);
  } catch (error) {
    console.error("Site settings unavailable; using safe defaults.");
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function loadSiteSettingsAdmin(db: SqlDatabase, user: AdminUser) {
  assertAdministrator(user);
  return { settings: await loadSiteSettings(db) };
}

export async function saveSiteSettings(db: SqlDatabase, user: AdminUser, input: unknown) {
  assertAdministrator(user);
  const mutation = siteSettingsMutationSchema.parse(input);
  const current = await db
    .prepare("SELECT revision FROM site_settings WHERE id = 1")
    .first<{ revision: number }>();
  if (current && current.revision !== mutation.settings.revision)
    throw new AdminError(409, "conflict", "Site settings changed. Reload and try again.");
  if (!current && mutation.settings.revision !== DEFAULT_SITE_SETTINGS.revision)
    throw new AdminError(409, "conflict", "Site settings changed. Reload and try again.");
  const nextRevision = (current?.revision ?? DEFAULT_SITE_SETTINGS.revision) + 1;
  const now = new Date().toISOString();
  const { revision: _revision, ...portableSettings } = mutation.settings;
  await db.batch([
    db
      .prepare(
        `INSERT INTO site_settings (id, settings_json, revision, updated_at, updated_by)
         VALUES (1, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET settings_json = excluded.settings_json,
           revision = excluded.revision, updated_at = excluded.updated_at,
           updated_by = excluded.updated_by`,
      )
      .bind(JSON.stringify(portableSettings), nextRevision, now, user.id),
    db
      .prepare(
        `INSERT INTO audit_log
          (id, actor_id, action, content_type, record_id, summary, created_at)
         VALUES (?, ?, 'site.settings', 'site_settings', 'settings', ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        user.id,
        `Updated public site identity, visitor information, and ${mutation.settings.serviceTimes.length} service time(s).`,
        now,
      ),
  ]);
  return { ok: true as const, revision: nextRevision };
}

export async function saveSiteImage(db: SqlDatabase, user: AdminUser, image: UploadedImage) {
  assertAdministrator(user);
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `INSERT INTO media_assets (id, content_type, body, byte_size, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(image.id, image.contentType, image.bytes, image.byteSize, now, user.id),
    db
      .prepare(
        `INSERT INTO audit_log
          (id, actor_id, action, content_type, record_id, summary, created_at)
         VALUES (?, ?, 'site.image-upload', 'site_settings', 'settings', ?, ?)`,
      )
      .bind(crypto.randomUUID(), user.id, "Uploaded a site-managed image.", now),
  ]);
  return { ok: true as const, path: mediaPath(image.id) };
}
