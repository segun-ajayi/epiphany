import { readFileSync, readdirSync } from "node:fs";
import type { SqliteDatabase } from "../src/lib/db/sqlite.server.ts";

export function migrate(database: SqliteDatabase) {
  const db = database.connection;
  db.exec("CREATE TABLE IF NOT EXISTS app_migrations (name TEXT PRIMARY KEY NOT NULL)");
  const d1Migrations = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='d1_migrations'")
    .get();
  const applied = new Set(
    (db.prepare("SELECT name FROM app_migrations").all() as { name: string }[]).map(
      (row) => row.name,
    ),
  );
  if (d1Migrations)
    for (const row of db.prepare("SELECT name FROM d1_migrations").all())
      applied.add(String(row.name));
  for (const file of readdirSync(new URL("../migrations/", import.meta.url))
    .filter((name) => /^\d+.*\.sql$/.test(name))
    .sort()) {
    if (applied.has(file)) continue;
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url), "utf8"));
      db.prepare("INSERT INTO app_migrations (name) VALUES (?)").run(file);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}
