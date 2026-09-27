import { AdminError } from "./permissions.ts";
import { SESSION_SECONDS } from "./session.server.ts";

export function parseAuthOrigin(setting: string | undefined, request: Request) {
  const requested = new URL(request.url);
  const local = (url: URL) => ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  let origin: URL;
  try {
    origin = new URL(setting || (local(requested) ? requested.origin : ""));
  } catch {
    throw new AdminError(
      503,
      "unconfigured",
      "Administrator sign-in is not configured for this address.",
    );
  }
  if (
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    (origin.protocol !== "https:" && !(origin.protocol === "http:" && local(origin)))
  ) {
    throw new AdminError(
      503,
      "unconfigured",
      "Administrator sign-in requires a configured HTTPS origin.",
    );
  }
  return origin.origin;
}

function cookieName(origin: string, kind: "session" | "oauth") {
  return `${origin.startsWith("https:") ? "__Host-" : ""}epiphany_${kind}`;
}
export function sessionCookie(token: string, origin: string, clear = false) {
  return makeCookie(token, origin, "session", clear ? 0 : SESSION_SECONDS);
}
export function oauthCookie(token: string, origin: string, clear = false) {
  return makeCookie(token, origin, "oauth", clear ? 0 : 600);
}
function makeCookie(token: string, origin: string, kind: "session" | "oauth", age: number) {
  return `${cookieName(origin, kind)}=${age ? token : ""}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${origin.startsWith("https:") ? "; Secure" : ""}`;
}
export function readSessionCookie(request: Request, origin: string) {
  return readCookie(request, origin, "session");
}
export function readOAuthCookie(request: Request, origin: string) {
  return readCookie(request, origin, "oauth");
}
function readCookie(request: Request, origin: string, kind: "session" | "oauth") {
  const name = cookieName(origin, kind);
  const cookies = (request.headers.get("cookie") || "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${name}=`));
  // Duplicate cookie names can indicate path/domain cookie shadowing.
  return cookies.length === 1 ? cookies[0].slice(name.length + 1) : null;
}
