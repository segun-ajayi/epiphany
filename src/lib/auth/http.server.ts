import { z } from "zod";
import {
  AuthorizationResponseError,
  ClientError,
  ResponseBodyError,
  WWWAuthenticateChallengeError,
  type Configuration,
} from "openid-client";
import { getDatabase, getAuthOriginSetting } from "../db/runtime.server.ts";
import { ADMIN_HEADERS } from "../admin/headers.ts";
import { adminFailure, assertSameOriginMutation, readLimitedJson } from "../admin/http.server.ts";
import {
  parseAuthOrigin,
  readSessionCookie,
  sessionCookie,
  readOAuthCookie,
  oauthCookie,
} from "./cookies.server.ts";
import { consumeAuthStart, createGoogleSession, signOut } from "./session.server.ts";
import {
  getGoogleConfiguration,
  googleAuthorizationUrl,
  verifyGoogleCallback,
  GOOGLE_ISSUER,
} from "./google.server.ts";
import { startOAuthFlow, consumeOAuthFlow } from "./oauth-state.server.ts";
import { AdminError } from "./permissions.ts";

function safeGoogleFailure(error: unknown) {
  const value = (input: unknown) =>
    typeof input === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(input) ? input : "unknown";
  if (error instanceof ResponseBodyError)
    return { kind: "token_response", status: error.status, code: value(error.error) };
  if (error instanceof AuthorizationResponseError)
    return { kind: "authorization_response", code: value(error.error) };
  if (error instanceof WWWAuthenticateChallengeError)
    return { kind: "token_challenge", status: error.status };
  if (error instanceof ClientError) return { kind: "client_validation", code: value(error.code) };
  if (error instanceof TypeError) return { kind: "provider_network" };
  return { kind: "unknown" };
}

// Optional configuration is server-side dependency injection for isolated provider tests only.
export async function handleAuth(request: Request, action: string, configured?: Configuration) {
  const headers = new Headers(ADMIN_HEADERS);
  try {
    if (!["google", "google-callback", "logout"].includes(action))
      return Response.json({ error: "Not found." }, { status: 404, headers });
    const method = action === "google-callback" ? "GET" : "POST";
    if (request.method !== method) {
      headers.set("Allow", method);
      return new Response(null, { status: 405, headers });
    }
    const origin = parseAuthOrigin(getAuthOriginSetting(request), request);
    if (new URL(request.url).origin !== origin)
      throw new AdminError(
        403,
        "invalid_origin",
        "Please use the configured website address to sign in.",
      );

    if (action === "google-callback") {
      const redirect = (reason?: string) => {
        headers.set("Location", reason ? `/admin?signin=${reason}` : "/admin");
        headers.append("Set-Cookie", oauthCookie("", origin, true));
        return new Response(null, { status: 303, headers });
      };
      try {
        const config = configured ?? getGoogleConfiguration(request);
        const url = new URL(request.url);
        if (
          request.url.length > 12288 ||
          ["code", "state", "error", "iss"].some((key) => url.searchParams.getAll(key).length > 1)
        )
          throw new AdminError(400, "expired", "Invalid sign-in response.");
        const db = await getDatabase(request);
        const flow = await consumeOAuthFlow(
          db,
          url.searchParams.get("state"),
          readOAuthCookie(request, origin),
          origin,
          config.clientMetadata().client_id,
        );
        if (url.searchParams.get("iss") !== GOOGLE_ISSUER) return redirect("failed");
        if (url.searchParams.has("error"))
          return redirect(
            url.searchParams.get("error") === "access_denied" ? "cancelled" : "failed",
          );
        const code = url.searchParams.get("code");
        if (!code || code.length > 4096) return redirect("failed");
        const identity = await verifyGoogleCallback(config, url, flow);
        const result = await createGoogleSession(db, identity);
        await signOut(db, readSessionCookie(request, origin));
        headers.append("Set-Cookie", sessionCookie(result.token, origin));
        return redirect();
      } catch (error) {
        // Never reflect or log provider responses, authorization codes, tokens or secrets.
        if (!(error instanceof AdminError) && !configured)
          console.error("Google sign-in failed.", safeGoogleFailure(error));
        const reason =
          error instanceof AdminError
            ? (
                { expired: "expired", forbidden: "denied", unconfigured: "unconfigured" } as Record<
                  string,
                  string
                >
              )[error.code]
            : undefined;
        return redirect(reason ?? "failed");
      }
    }

    assertSameOriginMutation(request, origin);
    z.object({})
      .strict()
      .parse(await readLimitedJson(request, 4096));
    if (action === "google") {
      const config = configured ?? getGoogleConfiguration(request);
      const db = await getDatabase(request);
      await consumeAuthStart(db);
      const flow = await startOAuthFlow(
        db,
        origin,
        config.clientMetadata().client_id,
        readOAuthCookie(request, origin),
      );
      const url = await googleAuthorizationUrl(config, origin, flow);
      headers.set("Set-Cookie", oauthCookie(flow.browser, origin));
      return Response.json({ url }, { headers });
    }
    const db = await getDatabase(request);
    await signOut(db, readSessionCookie(request, origin));
    headers.set("Set-Cookie", sessionCookie("", origin, true));
    return Response.json({ ok: true }, { headers });
  } catch (error) {
    const failure = adminFailure(error);
    if (failure.status === 429) headers.set("Retry-After", "900");
    return Response.json(
      { error: failure.message, code: failure.code },
      { status: failure.status, headers },
    );
  }
}
