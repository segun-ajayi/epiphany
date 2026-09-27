import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { SqliteDatabase } from "../src/lib/db/sqlite.server.ts";
import { migrate } from "./migrations.ts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { database: { type: "string" }, seed: { type: "boolean" }, file: { type: "string" } },
});
const path = resolve(values.database || process.env.SQLITE_PATH || ".data/app.sqlite");
mkdirSync(dirname(path), { recursive: true });
const db = new SqliteDatabase(path);
try {
  const operation = positionals[0];
  if (operation === "init") {
    migrate(db);
    if (values.seed) {
      db.connection.exec(readFileSync(new URL("../seed/local.sql", import.meta.url), "utf8"));
      db.connection.exec(
        readFileSync(new URL("../seed/initial-admin.sql", import.meta.url), "utf8"),
      );
    }
    console.log(`Database ready: ${path}`);
  } else if (operation === "export") {
    if (!values.file) throw new Error("Provide --file for the private export.");
    const { exportPortableData } = await import("../src/lib/db/transfer.server.ts");
    writeFileSync(resolve(values.file), JSON.stringify(await exportPortableData(db)), {
      flag: "wx",
      mode: 0o600,
    });
    console.log(
      "Private export created. It contains administrator identities, uploaded images, and audit history; store it securely and never commit it.",
    );
  } else if (operation === "import") {
    if (!values.file) throw new Error("Provide --file for the private export.");
    migrate(db);
    const { importPortableData } = await import("../src/lib/db/transfer.server.ts");
    await importPortableData(db, JSON.parse(readFileSync(resolve(values.file), "utf8")));
    console.log("Data restored into the empty database. Users must sign in again.");
  } else throw new Error("Choose init, export, or import.");
} finally {
  db.close();
}
