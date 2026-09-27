import { ADMIN_HEADERS } from "../admin/headers.ts";
import {
  adminFailure,
  assertSameOriginMutation,
  readLimitedJson,
  requireAdmin,
} from "../admin/http.server.ts";
import { parseAuthOrigin } from "../auth/cookies.server.ts";
import { getAuthOriginSetting } from "../db/runtime.server.ts";
import { createTeamMember, listTeamMembers, updateTeamMember } from "./repository.server.ts";
import { teamMutationSchema } from "./schemas.ts";

export async function handleAdminTeam(request: Request) {
  const json = (data: unknown, status = 200) =>
    Response.json(data, { status, headers: ADMIN_HEADERS });
  try {
    if (!["GET", "POST", "PATCH"].includes(request.method)) {
      return new Response(null, {
        status: 405,
        headers: { ...ADMIN_HEADERS, Allow: "GET, POST, PATCH" },
      });
    }
    if (request.method !== "GET") {
      assertSameOriginMutation(request, parseAuthOrigin(getAuthOriginSetting(request), request));
    }
    const { db, user } = await requireAdmin(request);
    if (request.method === "GET") return json(await listTeamMembers(db, user));
    const mutation = teamMutationSchema.parse(await readLimitedJson(request, 8 * 1024));
    if (request.method === "POST" && mutation.action === "create") {
      return json(await createTeamMember(db, user, mutation), 201);
    }
    if (request.method === "PATCH" && mutation.action === "update") {
      return json(await updateTeamMember(db, user, mutation));
    }
    return json(
      { error: "Use POST to add a member and PATCH to update one.", code: "invalid_method" },
      400,
    );
  } catch (error) {
    const failure = adminFailure(error);
    return json({ error: failure.message, code: failure.code }, failure.status);
  }
}
