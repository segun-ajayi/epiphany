import { DatabaseSync } from "node:sqlite";
import { DEFAULT_SITE_SETTINGS } from "../src/lib/site-settings/defaults.ts";

const [databasePath, preferredEmail] = process.argv.slice(2);
if (!databasePath) throw new Error("Provide the local SQLite database path.");

const database = new DatabaseSync(databasePath);
try {
  const administrator = preferredEmail
    ? database
        .prepare(
          "SELECT id FROM admin_users WHERE email = ? COLLATE NOCASE AND role = 'administrator' AND active = 1 LIMIT 1",
        )
        .get(preferredEmail)
    : database
        .prepare(
          "SELECT id FROM admin_users WHERE role = 'administrator' AND active = 1 ORDER BY created_at LIMIT 1",
        )
        .get();
  if (!administrator || typeof administrator.id !== "string")
    throw new Error("No active administrator is available to own the initial settings record.");

  const existing = database
    .prepare("SELECT settings_json, revision FROM site_settings WHERE id = 1")
    .get() as { settings_json: string; revision: number } | undefined;
  const stored = existing ? (JSON.parse(existing.settings_json) as Record<string, unknown>) : {};
  const { revision: _defaultRevision, ...portableDefaults } = DEFAULT_SITE_SETTINGS;
  const storedHome = (stored.home || {}) as Record<string, unknown>;
  const storedAbout = (stored.about || {}) as Record<string, unknown>;
  const storedVisit = (stored.visit || {}) as Record<string, unknown>;
  const storedPages = (stored.pages || {}) as Record<string, Record<string, unknown>>;
  const merged = {
    ...portableDefaults,
    ...stored,
    home: { ...portableDefaults.home, ...storedHome },
    about: { ...portableDefaults.about, ...storedAbout },
    visit: { ...portableDefaults.visit, ...storedVisit },
    pages: Object.fromEntries(
      Object.entries(portableDefaults.pages).map(([key, value]) => [
        key,
        { ...value, ...(storedPages[key] || {}) },
      ]),
    ),
  };
  const now = new Date().toISOString();

  database.exec("BEGIN IMMEDIATE");
  database
    .prepare(
      `INSERT INTO site_settings (id, settings_json, revision, updated_at, updated_by)
       VALUES (1, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET settings_json = excluded.settings_json,
         revision = excluded.revision, updated_at = excluded.updated_at,
         updated_by = excluded.updated_by`,
    )
    .run(JSON.stringify(merged), existing?.revision ?? 1, now, administrator.id);
  database
    .prepare(
      `INSERT INTO audit_log
        (id, actor_id, action, content_type, record_id, summary, created_at)
       VALUES (?, ?, 'site.settings.initialize', 'site_settings', 'settings', ?, ?)`,
    )
    .run(crypto.randomUUID(), administrator.id, "Initialized portable public site settings.", now);
  database.exec("COMMIT");
  console.log(
    existing ? "Site settings completed from safe defaults." : "Site settings initialized.",
  );
} catch (error) {
  try {
    database.exec("ROLLBACK");
  } catch {
    // No active transaction.
  }
  throw error;
} finally {
  database.close();
}
