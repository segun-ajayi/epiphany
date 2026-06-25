// Drizzle config for Cloudflare D1. Used when you self-host on your own
// Cloudflare account. Generate SQL migrations with: bunx drizzle-kit generate
// Then apply with wrangler: wrangler d1 migrations apply DB
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "d1-http",
} satisfies Config;
