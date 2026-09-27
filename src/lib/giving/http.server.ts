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
import {
  createReceiptRequest,
  deleteGivingReceipt,
  exportGivingReceiptsCsv,
  loadGivingAdmin,
  saveGivingSettings,
  updateReceiptStatus,
} from "./repository.server.ts";
import { givingAdminMutationSchema, receiptRequestSchema } from "./schemas.ts";
import { maxMultipartBytes, validateImageUpload } from "../admin/media.server.ts";
import { saveGivingQrImage } from "./repository.server.ts";

const PUBLIC_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const publicJson = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: PUBLIC_HEADERS });

async function consumeReceiptRateLimit(db: Awaited<ReturnType<typeof getDatabase>>) {
  const now = Math.floor(Date.now() / 1000);
  const row = await db
    .prepare(
      `INSERT INTO auth_rate_limits (bucket, window_start, attempts)
       VALUES ('giving-receipt', ?, 1)
       ON CONFLICT(bucket) DO UPDATE SET
         attempts = CASE WHEN window_start <= ? THEN 1 ELSE attempts + 1 END,
         window_start = CASE WHEN window_start <= ? THEN excluded.window_start ELSE window_start END
       RETURNING attempts`,
    )
    .bind(now, now - 3600, now - 3600)
    .first<{ attempts: number }>();
  if (!row || row.attempts > 100)
    throw new AdminError(429, "rate_limited", "Too many requests. Please try again later.");
}

export async function handleGivingReceiptRequest(request: Request) {
  try {
    if (request.method !== "POST")
      return new Response(null, { status: 405, headers: { ...PUBLIC_HEADERS, Allow: "POST" } });
    const origin = new URL(request.url).origin;
    const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (
      request.headers.get("origin") !== origin ||
      request.headers.get("sec-fetch-site") === "cross-site" ||
      request.headers.get("x-giving-request") !== "1" ||
      type !== "application/json"
    )
      throw new AdminError(403, "invalid_origin", "Please request a receipt from this website.");
    const input = receiptRequestSchema.parse(await readLimitedJson(request, 12 * 1024));
    const elapsed = Date.now() - input.startedAt;
    if (elapsed < 2000 || elapsed > 24 * 60 * 60 * 1000)
      throw new AdminError(400, "invalid_timing", "Please refresh the page and try again.");
    if (input.website)
      return publicJson({
        ok: true,
        message:
          "Your receipt request was received. The church will verify the donation before issuing a receipt.",
      });
    const db = await getDatabase(request);
    await consumeReceiptRateLimit(db);
    return publicJson(await createReceiptRequest(db, request, input), 201);
  } catch (error) {
    if (error instanceof AdminError)
      return publicJson({ error: error.message, code: error.code }, error.status);
    if (error instanceof z.ZodError)
      return publicJson(
        {
          error: "Check the receipt details, confirm consent, and try again.",
          code: "validation",
        },
        400,
      );
    console.error("Giving receipt request failed.");
    return publicJson(
      { error: "We could not save the receipt request. Please try again.", code: "unavailable" },
      503,
    );
  }
}

export async function handleAdminGiving(request: Request) {
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
    const url = new URL(request.url);
    if (request.method === "GET" && url.searchParams.get("format") === "csv") {
      return new Response(await exportGivingReceiptsCsv(db, user), {
        headers: {
          ...ADMIN_HEADERS,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="epiphany-giving-receipt-requests.csv"',
        },
      });
    }
    const page = z.coerce
      .number()
      .int()
      .min(0)
      .max(10000)
      .parse(url.searchParams.get("page") ?? 0);
    if (request.method === "GET") return json(await loadGivingAdmin(db, request, user, page));
    const mutation = givingAdminMutationSchema.parse(await readLimitedJson(request, 64 * 1024));
    if (mutation.action === "save-settings")
      return json(await saveGivingSettings(db, user, mutation));
    if (mutation.action === "receipt-delete")
      return json(await deleteGivingReceipt(db, user, mutation));
    return json(await updateReceiptStatus(db, user, mutation));
  } catch (error) {
    const failure = adminFailure(error);
    return json({ error: failure.message, code: failure.code }, failure.status);
  }
}

export async function handleAdminGivingMedia(request: Request) {
  const json = (data: unknown, status = 200) =>
    Response.json(data, { status, headers: ADMIN_HEADERS });
  try {
    if (request.method !== "POST")
      return new Response(null, { status: 405, headers: { ...ADMIN_HEADERS, Allow: "POST" } });
    assertSameOriginMutation(request, parseAuthOrigin(getAuthOriginSetting(request), request), [
      "multipart/form-data",
    ]);
    if (Number(request.headers.get("content-length")) > maxMultipartBytes)
      throw new AdminError(413, "too_large", "The QR image is too large.");
    const { db, user } = await requireAdmin(request);
    const form = await request.formData();
    if ([...form.keys()].some((key) => !["method", "image"].includes(key)))
      throw new AdminError(400, "invalid_form", "The upload contains unexpected fields.");
    const method = z.enum(["zelle", "cash_app"]).parse(form.get("method"));
    const image = await validateImageUpload(form.get("image"));
    if (!image) throw new AdminError(400, "invalid_image", "Choose a QR image to upload.");
    return json(await saveGivingQrImage(db, user, method, image), 201);
  } catch (error) {
    const failure = adminFailure(error);
    return json({ error: failure.message, code: failure.code }, failure.status);
  }
}
