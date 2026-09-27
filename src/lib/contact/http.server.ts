import { z } from "zod";
import { ADMIN_HEADERS } from "../admin/headers.ts";
import {
  adminFailure,
  assertSameOriginMutation,
  readLimitedJson,
  requireAdmin,
} from "../admin/http.server.ts";
import { parseAuthOrigin } from "../auth/cookies.server.ts";
import { AdminError } from "../auth/permissions.ts";
import { getAuthOriginSetting, getDatabase } from "../db/runtime.server.ts";
import { contactSubmissionSchema } from "./schemas.ts";
import {
  createContactMessage,
  loadContactInbox,
  updateContactMessage,
} from "./repository.server.ts";

const PUBLIC_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};
const publicJson = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: PUBLIC_HEADERS });

async function consumeRateLimit(db: Awaited<ReturnType<typeof getDatabase>>) {
  const now = Math.floor(Date.now() / 1000);
  const row = await db
    .prepare(
      `INSERT INTO auth_rate_limits (bucket, window_start, attempts)
    VALUES ('contact-message', ?, 1) ON CONFLICT(bucket) DO UPDATE SET
    attempts = CASE WHEN window_start <= ? THEN 1 ELSE attempts + 1 END,
    window_start = CASE WHEN window_start <= ? THEN excluded.window_start ELSE window_start END
    RETURNING attempts`,
    )
    .bind(now, now - 3600, now - 3600)
    .first<{ attempts: number }>();
  if (!row || row.attempts > 100)
    throw new AdminError(
      429,
      "rate_limited",
      "Too many messages have been submitted. Please try again later.",
    );
}

export async function handleContactSubmission(request: Request) {
  try {
    if (request.method !== "POST")
      return new Response(null, { status: 405, headers: { ...PUBLIC_HEADERS, Allow: "POST" } });
    const origin = new URL(request.url).origin;
    const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (
      request.headers.get("origin") !== origin ||
      request.headers.get("sec-fetch-site") === "cross-site" ||
      request.headers.get("x-contact-request") !== "1" ||
      type !== "application/json"
    )
      throw new AdminError(403, "invalid_origin", "Please send your message from this website.");
    const input = contactSubmissionSchema.parse(await readLimitedJson(request, 12 * 1024));
    const elapsed = Date.now() - input.startedAt;
    if (elapsed < 2000 || elapsed > 24 * 60 * 60 * 1000)
      throw new AdminError(400, "invalid_timing", "Please refresh the page and try again.");
    if (input.website)
      return publicJson({ ok: true, message: "Thank you — your message has been received." }, 201);
    const db = await getDatabase(request);
    await consumeRateLimit(db);
    return publicJson(await createContactMessage(db, input), 201);
  } catch (error) {
    if (error instanceof AdminError)
      return publicJson({ error: error.message, code: error.code }, error.status);
    if (error instanceof z.ZodError)
      return publicJson(
        { error: "Check your details, confirm consent, and try again.", code: "validation" },
        400,
      );
    console.error("Contact submission failed.");
    return publicJson(
      {
        error: "We could not save your message. Please try again or contact the church directly.",
        code: "unavailable",
      },
      503,
    );
  }
}

export async function handleAdminContact(request: Request) {
  const json = (data: unknown, status = 200) =>
    Response.json(data, { status, headers: ADMIN_HEADERS });
  try {
    if (!["GET", "PATCH"].includes(request.method))
      return new Response(null, {
        status: 405,
        headers: { ...ADMIN_HEADERS, Allow: "GET, PATCH" },
      });
    if (request.method === "PATCH")
      assertSameOriginMutation(request, parseAuthOrigin(getAuthOriginSetting(request), request));
    const { db, user } = await requireAdmin(request);
    if (request.method === "GET") {
      const page = z.coerce
        .number()
        .int()
        .min(0)
        .max(10000)
        .parse(new URL(request.url).searchParams.get("page") ?? 0);
      return json(await loadContactInbox(db, user, page));
    }
    return json(await updateContactMessage(db, user, await readLimitedJson(request, 16 * 1024)));
  } catch (error) {
    const failure = adminFailure(error);
    return json({ error: failure.message, code: failure.code }, failure.status);
  }
}
