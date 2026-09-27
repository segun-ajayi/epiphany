import type { SqlDatabase } from "./sql.types.ts";
import type { CloudflareRuntimeRequest, CloudflareBindings } from "./d1.types.ts";

declare const __APP_PLATFORM__: "node" | "cloudflare";
const attached = new WeakMap<Request, { database: SqlDatabase; authOrigin?: string }>();

export function bindHostRuntime(request: Request, env: unknown, context: unknown) {
  if (typeof __APP_PLATFORM__ !== "undefined" && __APP_PLATFORM__ === "node") return;
  const runtime = request as CloudflareRuntimeRequest;
  runtime.runtime ??= { name: "cloudflare" };
  runtime.runtime.cloudflare ??= { env: env as CloudflareBindings, context };
  runtime.runtime.cloudflare.env ??= env as CloudflareBindings;
}

// Host-side dependency injection, not an HTTP header or request-body option.
export function attachDatabase(request: Request, database: SqlDatabase, authOrigin?: string) {
  attached.set(request, { database, authOrigin });
}

export function getAuthOriginSetting(request: Request) {
  return attached.get(request)?.authOrigin ?? getAuthSetting(request, "AUTH_ORIGIN");
}

export function getAuthSetting(
  request: Request,
  name: Exclude<keyof CloudflareBindings, "DB">,
) {
  return (
    (request as CloudflareRuntimeRequest).runtime?.cloudflare?.env?.[name] ?? process.env[name]
  );
}

export async function getDatabase(request: Request): Promise<SqlDatabase> {
  const database = attached.get(request)?.database;
  if (database) return database;
  if (typeof __APP_PLATFORM__ !== "undefined" && __APP_PLATFORM__ === "node") {
    const { getNodeDatabase } = await import("./sqlite.server.ts");
    return getNodeDatabase();
  }
  const binding = (request as CloudflareRuntimeRequest).runtime?.cloudflare?.env?.DB;
  if (!binding) throw new Error("Database is not configured.");
  return binding;
}
