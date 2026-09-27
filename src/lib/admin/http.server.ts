import { z } from "zod";
import { verifySession } from "../auth/session.server.ts";
import { parseAuthOrigin, readSessionCookie } from "../auth/cookies.server.ts";
import { AdminError } from "../auth/permissions.ts";
import { getDatabase, getAuthOriginSetting } from "../db/runtime.server.ts";
import { loadAdminContent, saveAdminContent } from "./repository.server.ts";
import { ADMIN_HEADERS } from "./headers.ts";
import { maxMultipartBytes, validateImageUpload, validatePdfUpload } from "./media.server.ts";

export function assertSameOriginMutation(
  request: Request,
  origin = new URL(request.url).origin,
  allowedTypes = ["application/json"],
) {
  const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (
    !["POST", "PATCH"].includes(request.method) ||
    request.headers.get("origin") !== origin ||
    request.headers.get("sec-fetch-site") === "cross-site" ||
    request.headers.get("x-admin-request") !== "1" ||
    !type ||
    !allowedTypes.includes(type)
  ) {
    throw new AdminError(
      403,
      "invalid_origin",
      "This change must be submitted from the admin website.",
    );
  }
}

async function readLimitedBytes(request: Request, limit: number) {
  if (Number(request.headers.get("content-length")) > limit)
    throw new AdminError(413, "too_large", "This submission is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new AdminError(400, "invalid_json", "A JSON body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new AdminError(413, "too_large", "This submission is too large.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

export async function readLimitedJson(request: Request, limit = 64 * 1024) {
  const bytes = await readLimitedBytes(request, limit);
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new AdminError(400, "invalid_json", "The submission is not valid JSON.");
  }
}

async function readContentSubmission(request: Request) {
  const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (type === "application/json") {
    return { body: await readLimitedJson(request), image: null, notes: null };
  }

  if (Number(request.headers.get("content-length")) > maxMultipartBytes) {
    throw new AdminError(413, "too_large", "This submission is too large.");
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new AdminError(400, "invalid_form", "The upload form is not valid.");
  }
  if ([...form.keys()].some((key) => !["payload", "image", "notes"].includes(key))) {
    throw new AdminError(400, "invalid_form", "The upload form contains unexpected fields.");
  }
  if (
    form.getAll("payload").length !== 1 ||
    form.getAll("image").length > 1 ||
    form.getAll("notes").length > 1
  ) {
    throw new AdminError(400, "invalid_form", "The upload form is not valid.");
  }
  const payload = form.get("payload");
  const image = form.get("image");
  const notes = form.get("notes");
  const payloadBytes =
    typeof payload === "string" ? new TextEncoder().encode(payload).byteLength : 0;
  const imageBytes = image instanceof File ? image.size : 0;
  const notesBytes = notes instanceof File ? notes.size : 0;
  if (payloadBytes + imageBytes + notesBytes > maxMultipartBytes) {
    throw new AdminError(413, "too_large", "This submission is too large.");
  }
  if (typeof payload !== "string" || payloadBytes > 64 * 1024) {
    throw new AdminError(400, "invalid_json", "The content submission is not valid.");
  }
  let body: unknown;
  try {
    body = JSON.parse(payload);
  } catch {
    throw new AdminError(400, "invalid_json", "The content submission is not valid.");
  }
  return {
    body,
    image: await validateImageUpload(image),
    notes: await validatePdfUpload(notes),
  };
}

export async function requireAdmin(request: Request) {
  const origin = parseAuthOrigin(getAuthOriginSetting(request), request);
  const db = await getDatabase(request);
  const user = await verifySession(db, readSessionCookie(request, origin));
  return { user, db };
}

export function adminFailure(error: unknown) {
  if (error instanceof AdminError)
    return { status: error.status, code: error.code, message: error.message };
  if (error instanceof z.ZodError)
    return {
      status: 400,
      code: "validation",
      message: error.issues
        .map((issue) => `${issue.path.join(".") || "Record"}: ${issue.message}`)
        .join(" "),
    };
  // Do not log raw SQL, form data, or authentication tokens.
  console.error("Administrator request failed.");
  return {
    status: 503,
    code: "unavailable",
    message: "The administrator service is temporarily unavailable.",
  };
}

export async function loadAdminScreen(request: Request) {
  try {
    const { db, user } = await requireAdmin(request);
    return { state: "ready" as const, data: await loadAdminContent(db, user) };
  } catch (error) {
    return { state: "blocked" as const, error: adminFailure(error) };
  }
}

export async function handleAdminContent(request: Request) {
  const json = (data: unknown, status = 200) =>
    Response.json(data, { status, headers: ADMIN_HEADERS });
  try {
    if (!["GET", "POST", "PATCH"].includes(request.method)) {
      return new Response(null, {
        status: 405,
        headers: { ...ADMIN_HEADERS, Allow: "GET, POST, PATCH" },
      });
    }
    if (request.method !== "GET")
      assertSameOriginMutation(request, parseAuthOrigin(getAuthOriginSetting(request), request), [
        "application/json",
        "multipart/form-data",
      ]);
    const { db, user } = await requireAdmin(request);
    if (request.method === "GET") {
      const page = z.coerce
        .number()
        .int()
        .min(0)
        .max(10000)
        .parse(new URL(request.url).searchParams.get("page") ?? 0);
      return json(await loadAdminContent(db, user, page));
    }
    const { body, image, notes } = await readContentSubmission(request);
    const input = z.object({ id: z.string().optional() }).passthrough().parse(body);
    if ((request.method === "POST" && input.id) || (request.method === "PATCH" && !input.id)) {
      throw new AdminError(
        400,
        "invalid_method",
        "Use POST to create a record and PATCH to update one.",
      );
    }
    return json(
      await saveAdminContent(db, user, body, image, notes),
      request.method === "POST" ? 201 : 200,
    );
  } catch (error) {
    const failure = adminFailure(error);
    return json({ error: failure.message, code: failure.code }, failure.status);
  }
}
