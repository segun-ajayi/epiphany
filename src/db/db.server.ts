import { drizzle } from "drizzle-orm/d1";

export function getDb() {
  const db = (globalThis as any)?.env?.DB;

  if (!db) {
    throw new Error("Cloudflare D1 binding 'DB' is not available");
  }

  return drizzle(db);
}
