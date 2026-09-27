import { ADMIN_HEADERS } from "../admin/headers.ts";
import { adminFailure, assertSameOriginMutation, requireAdmin } from "../admin/http.server.ts";
import { maxMultipartBytes, validateImageUpload } from "../admin/media.server.ts";
import { parseAuthOrigin } from "../auth/cookies.server.ts";
import { AdminError } from "../auth/permissions.ts";
import { getAuthOriginSetting } from "../db/runtime.server.ts";
import { loadAdminLeaders, saveLeader } from "./repository.server.ts";

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: ADMIN_HEADERS });

export async function handleAdminLeadership(request: Request) {
  try {
    if (!["GET", "POST", "PATCH"].includes(request.method))
      return new Response(null, {
        status: 405,
        headers: { ...ADMIN_HEADERS, Allow: "GET, POST, PATCH" },
      });
    if (request.method !== "GET")
      assertSameOriginMutation(request, parseAuthOrigin(getAuthOriginSetting(request), request), [
        "multipart/form-data",
      ]);
    const { db, user } = await requireAdmin(request);
    if (request.method === "GET") return json(await loadAdminLeaders(db));
    if (Number(request.headers.get("content-length")) > maxMultipartBytes)
      throw new AdminError(413, "too_large", "The profile submission is too large.");
    const form = await request.formData();
    if ([...form.keys()].some((key) => !["payload", "image"].includes(key)))
      throw new AdminError(400, "invalid_form", "The profile contains unexpected fields.");
    const payload = form.get("payload");
    if (typeof payload !== "string" || new TextEncoder().encode(payload).byteLength > 64 * 1024)
      throw new AdminError(400, "invalid_json", "The profile details are not valid.");
    let input: unknown;
    try {
      input = JSON.parse(payload);
    } catch {
      throw new AdminError(400, "invalid_json", "The profile details are not valid.");
    }
    const image = await validateImageUpload(form.get("image"));
    return json(await saveLeader(db, user, input, image), request.method === "POST" ? 201 : 200);
  } catch (error) {
    const failure = adminFailure(error);
    return json({ error: failure.message, code: failure.code }, failure.status);
  }
}
