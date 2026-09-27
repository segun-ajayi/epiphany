import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

export function executeD1(
  sql: string,
  remote = false,
): { results: Record<string, unknown>[]; success: boolean }[] {
  const output = execFileSync(
    process.execPath,
    [
      resolve("node_modules/wrangler/bin/wrangler.js"),
      "d1",
      "execute",
      "epiphany-db",
      remote ? "--remote" : "--local",
      "--command",
      sql,
      "--json",
    ],
    {
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, WRANGLER_LOG_PATH: resolve(".wrangler/logs") },
    },
  );
  const result = JSON.parse(output);
  if (!Array.isArray(result) || result.some((entry) => !entry.success))
    throw new Error("Database operation failed.");
  return result;
}

export const sqlString = (value: string) => `'${value.replaceAll("'", "''")}'`;
