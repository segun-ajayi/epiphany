import { z } from "zod";
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
import {
  addGalleryPhoto,
  loadAdminGallery,
  mutateGalleryPhoto,
  saveGalleryAlbum,
} from "./repository.server";

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: ADMIN_HEADERS });

export async function handleAdminGallery(request: Request) {
  try {
    if (!["GET", "POST", "PATCH"].includes(request.method))
      return new Response(null, {
        status: 405,
        headers: { ...ADMIN_HEADERS, Allow: "GET, POST, PATCH" },
      });
    if (request.method !== "GET")
      assertSameOriginMutation(request, parseAuthOrigin(getAuthOriginSetting(request), request));
    const { db, user } = await requireAdmin(request);
    if (request.method === "GET") return json(await loadAdminGallery(db));
    const body = await readLimitedJson(request);
    if (request.method === "POST") return json(await saveGalleryAlbum(db, user, body), 201);
    const action = z.object({ action: z.string() }).passthrough().parse(body).action;
    return json(
      action === "save-album"
        ? await saveGalleryAlbum(db, user, body)
        : await mutateGalleryPhoto(db, user, body),
    );
  } catch (error) {
    const failure = adminFailure(error);
    return json({ error: failure.message, code: failure.code }, failure.status);
  }
}

export async function handleAdminGalleryMedia(request: Request) {
  try {
    if (request.method !== "POST")
      return new Response(null, { status: 405, headers: { ...ADMIN_HEADERS, Allow: "POST" } });
    assertSameOriginMutation(request, parseAuthOrigin(getAuthOriginSetting(request), request), [
      "multipart/form-data",
    ]);
    if (Number(request.headers.get("content-length")) > maxMultipartBytes)
      throw new AdminError(413, "too_large", "The photo is too large.");
    const { db, user } = await requireAdmin(request);
    const form = await request.formData();
    if (
      [...form.keys()].some(
        (key) =>
          !["albumId", "image", "thumbnail", "width", "height", "alt", "caption"].includes(key),
      )
    )
      throw new AdminError(400, "invalid_form", "The upload contains unexpected fields.");
    const albumId = z.string().uuid().parse(form.get("albumId"));
    const alt = z.string().parse(form.get("alt"));
    const captionValue = form.get("caption");
    const image = await validateImageUpload(form.get("image"));
    const thumbnail = await validateImageUpload(form.get("thumbnail"));
    if (!image) throw new AdminError(400, "invalid_image", "Choose a photo to upload.");
    if (!thumbnail)
      throw new AdminError(400, "invalid_thumbnail", "The photo thumbnail is missing.");
    const width = z.coerce.number().int().min(1).max(1600).parse(form.get("width"));
    const height = z.coerce.number().int().min(1).max(1600).parse(form.get("height"));
    return json(
      await addGalleryPhoto(
        db,
        user,
        albumId,
        alt,
        typeof captionValue === "string" ? captionValue : null,
        image,
        thumbnail,
        width,
        height,
      ),
      201,
    );
  } catch (error) {
    const failure = adminFailure(error);
    return json({ error: failure.message, code: failure.code }, failure.status);
  }
}
