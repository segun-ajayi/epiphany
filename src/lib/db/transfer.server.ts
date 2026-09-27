import { z } from "zod";
import type { SqlDatabase, SqlValue } from "./sql.types.ts";

export const portableTables = [
  "admin_users",
  "media_assets",
  "ministries",
  "events",
  "sermons",
  "newsletter_subscribers",
  "newsletter_delivery_settings",
  "newsletter_provider_sync",
  "newsletter_campaigns",
  "giving_settings",
  "giving_methods",
  "giving_designations",
  "giving_impact_items",
  "giving_receipt_requests",
  "audit_log",
] as const;
export const portableSelect = (table: (typeof portableTables)[number]) =>
  table === "admin_users"
    ? "SELECT id, email, role, active, auth_version, google_subject, created_at, updated_at FROM admin_users"
    : table === "media_assets"
      ? "SELECT id, content_type, hex(body) AS body_hex, byte_size, created_at, created_by FROM media_assets"
      : `SELECT * FROM ${table}`;
const rowSchema = z.record(z.union([z.string(), z.number().finite(), z.null()]));
export const transferSchema = z
  .object({
    format: z.literal("epiphany-portable-v1"),
    schemaVersion: z.union([
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
      z.literal(7),
      z.literal(8),
      z.literal(9),
      z.literal(10),
      z.literal(11),
    ]),
    tables: z
      .object({
        admin_users: z.array(rowSchema),
        media_assets: z.array(rowSchema).default([]),
        ministries: z.array(rowSchema),
        events: z.array(rowSchema),
        sermons: z.array(rowSchema).default([]),
        newsletter_subscribers: z.array(rowSchema).default([]),
        newsletter_delivery_settings: z.array(rowSchema).default([]),
        newsletter_provider_sync: z.array(rowSchema).default([]),
        newsletter_campaigns: z.array(rowSchema).default([]),
        giving_settings: z.array(rowSchema).default([]),
        giving_methods: z.array(rowSchema).default([]),
        giving_designations: z.array(rowSchema).default([]),
        giving_impact_items: z.array(rowSchema).default([]),
        giving_receipt_requests: z.array(rowSchema).default([]),
        audit_log: z.array(rowSchema),
      })
      .strict(),
  })
  .strict();

export async function exportPortableData(db: SqlDatabase) {
  const results = await db.batch(portableTables.map((table) => db.prepare(portableSelect(table))));
  return transferSchema.parse({
    format: "epiphany-portable-v1",
    schemaVersion: 11,
    tables: Object.fromEntries(
      portableTables.map((table, index) => [table, results[index].results]),
    ),
  });
}

export async function importPortableData(db: SqlDatabase, input: unknown) {
  const payload = transferSchema.parse(input);
  // Operator-only, offline restore into an empty initialized database. Never merge
  // over live data. Sessions, OAuth states, recovery tokens and counters do not migrate.
  // Legacy v3 exports are accepted, but their retired passwords are never restored.
  for (const row of payload.tables.admin_users) {
    delete row.password_hash;
    delete row.password_changed_at;
    if (payload.schemaVersion === 3) delete row.google_subject;
  }
  for (const table of [
    ...portableTables,
    "admin_sessions",
    "admin_password_resets",
    "admin_oauth_states",
  ]) {
    const count = await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>();
    // A newly migrated database contains the singleton delivery-settings row.
    // It is configuration scaffolding, not user data, and is replaced below
    // when the portable archive contains its own settings.
    if (table === "newsletter_delivery_settings" && (count?.n ?? 0) <= 1) continue;
    if (count?.n)
      throw new Error("Restore requires an empty database. Existing data was not overwritten.");
  }
  const statements = [];
  for (const table of portableTables) {
    const info = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
    const allowed = new Set(info.results.map((column) => column.name));
    if (table === "newsletter_delivery_settings" && payload.tables[table].length) {
      statements.push(db.prepare("DELETE FROM newsletter_delivery_settings WHERE id = 1"));
    }
    for (const row of payload.tables[table]) {
      const normalized: Record<string, SqlValue> = { ...row };
      if (table === "media_assets") {
        const hex = normalized.body_hex;
        if (
          typeof hex !== "string" ||
          hex.length === 0 ||
          hex.length > 2_500_000 ||
          hex.length % 2 !== 0 ||
          !/^[0-9a-f]+$/i.test(hex)
        ) {
          throw new Error("Invalid media data");
        }
        const bytes = new Uint8Array(hex.length / 2);
        for (let index = 0; index < bytes.length; index++) {
          bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
        }
        delete normalized.body_hex;
        normalized.body = bytes.buffer;
      }
      const columns = Object.keys(normalized);
      if (!columns.length || columns.some((column) => !allowed.has(column)))
        throw new Error(`Invalid columns for ${table}`);
      statements.push(
        db
          .prepare(
            `INSERT INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`,
          )
          .bind(...columns.map((column) => normalized[column])),
      );
    }
  }
  if (statements.length) await db.batch(statements);
}
