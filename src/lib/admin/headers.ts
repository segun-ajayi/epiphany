export const ADMIN_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
};

export function protectAdminResponse(request: Request, response: Response) {
  const path = new URL(request.url).pathname;
  if (!/^\/(?:admin|api\/admin)(?:\/|$)/.test(path)) return response;
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(ADMIN_HEADERS)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function protectResponse(request: Request, response: Response) {
  const adminProtected = protectAdminResponse(request, response);
  const headers = new Headers(adminProtected.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()",
  );
  if (!headers.has("Referrer-Policy"))
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (new URL(request.url).protocol === "https:")
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return new Response(adminProtected.body, {
    status: adminProtected.status,
    statusText: adminProtected.statusText,
    headers,
  });
}
