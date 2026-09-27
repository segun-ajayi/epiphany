import * as oidc from "openid-client";
import { getAuthSetting } from "../db/runtime.server.ts";
import { AdminError } from "./permissions.ts";
import { nowSeconds } from "./session.server.ts";

export const GOOGLE_ISSUER = "https://accounts.google.com";
export const CALLBACK_PATH = "/api/admin/auth/google-callback";
export type GoogleIdentity = { subject: string; email: string; authoritativeEmail: boolean };

// Fixed provider endpoints: neither headers nor submitted URLs can select an issuer.
export function createGoogleConfiguration(clientId: string, secret: string) {
  const config = new oidc.Configuration(
    {
      issuer: GOOGLE_ISSUER,
      authorization_endpoint: `${GOOGLE_ISSUER}/o/oauth2/v2/auth`,
      token_endpoint: "https://oauth2.googleapis.com/token",
      jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
      response_types_supported: ["code"],
      id_token_signing_alg_values_supported: ["RS256"],
      code_challenge_methods_supported: ["S256"],
      authorization_response_iss_parameter_supported: true,
    },
    clientId,
    { client_secret: secret, id_token_signed_response_alg: "RS256" },
  );
  oidc.enableNonRepudiationChecks(config);
  config.timeout = 10;
  return config;
}

let cached: { id: string; secret: string; config: oidc.Configuration } | undefined;
export function getGoogleConfiguration(request: Request) {
  const id = getAuthSetting(request, "GOOGLE_CLIENT_ID")?.trim();
  const secret = getAuthSetting(request, "GOOGLE_CLIENT_SECRET")?.trim();
  if (!id || !/^[\w-]+\.apps\.googleusercontent\.com$/.test(id) || !secret || secret.length > 1024)
    throw new AdminError(
      503,
      "unconfigured",
      "Google sign-in is not connected yet. The site owner needs to complete Google setup.",
    );
  if (!cached || cached.id !== id || cached.secret !== secret)
    cached = { id, secret, config: createGoogleConfiguration(id, secret) };
  return cached.config;
}

export async function googleAuthorizationUrl(
  config: oidc.Configuration,
  origin: string,
  flow: { state: string; nonce: string; verifier: string },
) {
  return oidc.buildAuthorizationUrl(config, {
    redirect_uri: origin + CALLBACK_PATH,
    response_type: "code",
    scope: "openid email",
    prompt: "select_account",
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: await oidc.calculatePKCECodeChallenge(flow.verifier),
    code_challenge_method: "S256",
  }).href;
}

export async function verifyGoogleCallback(
  config: oidc.Configuration,
  url: URL,
  flow: { nonce: string; verifier: string; state: string },
): Promise<GoogleIdentity> {
  const tokens = await oidc.authorizationCodeGrant(config, url, {
    expectedState: flow.state,
    expectedNonce: flow.nonce,
    pkceCodeVerifier: flow.verifier,
    idTokenExpected: true,
  });
  const claims = tokens.claims();
  // The library verifies issuer, audience, expiry, nonce and RS256 signature first.
  if (
    !claims ||
    typeof claims.sub !== "string" ||
    !claims.sub ||
    claims.sub.length > 255 ||
    typeof claims.email !== "string" ||
    claims.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claims.email) ||
    claims.email_verified !== true ||
    !Number.isInteger(claims.iat) ||
    claims.iat > nowSeconds() + 60 ||
    claims.iat < nowSeconds() - 660
  )
    throw new AdminError(403, "forbidden", "Google could not verify this administrator identity.");
  const email = claims.email.toLowerCase();
  const domain = email.split("@")[1];
  // Google is not authoritative for ownership of arbitrary third-party email addresses.
  const authoritativeEmail =
    domain === "gmail.com" || (typeof claims.hd === "string" && claims.hd.toLowerCase() === domain);
  return { subject: claims.sub, email, authoritativeEmail };
}
