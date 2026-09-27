import { parseArgs } from "node:util";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { executeD1 } from "./d1-operator.ts";
import { portableTables, portableSelect, transferSchema } from "../src/lib/db/transfer.server.ts";

const { values } = parseArgs({
  options: { remote: { type: "boolean" }, file: { type: "string" } },
});
if (!values.file)
  throw new Error(
    "Provide --file for the private export. Pause content/account writes before exporting.",
  );
const results = executeD1(portableTables.map(portableSelect).join(";"), values.remote);
const payload = transferSchema.parse({
  format: "epiphany-portable-v1",
  schemaVersion: 9,
  tables: Object.fromEntries(
    portableTables.map((table, index) => [table, results[index]?.results]),
  ),
});
writeFileSync(resolve(values.file), JSON.stringify(payload), { flag: "wx", mode: 0o600 });
console.log(
  "Private portable export created. It contains administrator identities, uploaded images, and audit history; never publish it. Passwords, sessions, and OAuth states are excluded.",
);
