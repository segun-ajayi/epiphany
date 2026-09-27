import { ADMIN_HEADERS } from "@/lib/admin/headers";
import {
  adminFailure,
  assertSameOriginMutation,
  readLimitedJson,
  requireAdmin,
} from "@/lib/admin/http.server";
import { maxMultipartBytes, validateImageUpload } from "@/lib/admin/media.server";
import { parseAuthOrigin } from "@/lib/auth/cookies.server";
import { AdminError } from "@/lib/auth/permissions";
import { getAuthOriginSetting } from "@/lib/db/runtime.server";
import { loadSiteSettingsAdmin, saveSiteImage, saveSiteSettings } from "./repository.server";

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: ADMIN_HEADERS });

export async function handleAdminSiteSettings(request: Request) {
  try {
    if (!["GET", "PATCH"].includes(request.method))
      return new Response(null, {
        status: 405,
        headers: { ...ADMIN_HEADERS, Allow: "GET, PATCH" },
      });
    if (request.method === "PATCH")
      assertSameOriginMutation(request, parseAuthOrigin(getAuthOriginSetting(request), request));
    const { db, user } = await requireAdmin(request);
    if (request.method === "GET") return json(await loadSiteSettingsAdmin(db, user));
    return json(await saveSiteSettings(db, user, await readLimitedJson(request, 256 * 1024)));
  } catch (error) {
    const failure = adminFailure(error);
    return json({ error: failure.message, code: failure.code }, failure.status);
  }
}

export async function handleAdminSiteSettingsMedia(request: Request) {
  try {
    if (request.method !== "POST")
      return new Response(null, { status: 405, headers: { ...ADMIN_HEADERS, Allow: "POST" } });
    assertSameOriginMutation(request, parseAuthOrigin(getAuthOriginSetting(request), request), [
      "multipart/form-data",
    ]);
    if (Number(request.headers.get("content-length")) > maxMultipartBytes)
      throw new AdminError(413, "too_large", "The site image is too large.");
    const { db, user } = await requireAdmin(request);
    const form = await request.formData();
    if ([...form.keys()].some((key) => key !== "image"))
      throw new AdminError(400, "invalid_form", "The upload contains unexpected fields.");
    const image = await validateImageUpload(form.get("image"));
    if (!image) throw new AdminError(400, "invalid_image", "Choose an image to upload.");
    return json(await saveSiteImage(db, user, image), 201);
  } catch (error) {
    const failure = adminFailure(error);
    return json({ error: failure.message, code: failure.code }, failure.status);
  }
}
