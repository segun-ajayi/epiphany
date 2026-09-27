import { customFetch } from "openid-client";
import { createGoogleConfiguration, GOOGLE_ISSUER } from "../../src/lib/auth/google.server.ts";

// Isolated test transport, never imported by the application. No live Google calls.
export async function fakeGoogle() {
  const keys = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const jwk = {
    ...(await crypto.subtle.exportKey("jwk", keys.publicKey)),
    kid: "test-key",
    alg: "RS256",
    use: "sig",
  };
  const clientId = "test-client.apps.googleusercontent.com";
  const config = createGoogleConfiguration(clientId, "disposable-test-secret");
  const codes = new Map<
    string,
    { authorization: URL; claims: Record<string, unknown>; forged: boolean }
  >();
  let tokenRequests = 0;
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  config[customFetch] = async (input, options) => {
    if (String(input) === "https://www.googleapis.com/oauth2/v3/certs")
      return Response.json({ keys: [jwk] });
    if (String(input) !== "https://oauth2.googleapis.com/token")
      throw new Error("Unexpected provider URL");
    tokenRequests++;
    const body = new URLSearchParams(options?.body as string);
    const code = body.get("code") || "";
    const pending = codes.get(code);
    codes.delete(code);
    if (!pending) return Response.json({ error: "invalid_grant" }, { status: 400 });
    const challenge = Buffer.from(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(body.get("code_verifier") || ""),
      ),
    ).toString("base64url");
    if (
      body.get("client_secret") !== "disposable-test-secret" ||
      body.get("client_id") !== clientId ||
      body.get("redirect_uri") !== pending.authorization.searchParams.get("redirect_uri") ||
      challenge !== pending.authorization.searchParams.get("code_challenge")
    )
      throw new Error("Code exchange validation failed");
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: GOOGLE_ISSUER,
      aud: clientId,
      sub: "google-test-user",
      email: "mortalerror@gmail.com",
      email_verified: true,
      iat: now,
      exp: now + 300,
      nonce: pending.authorization.searchParams.get("nonce"),
      ...pending.claims,
    };
    const signed = `${encode({ alg: "RS256", kid: "test-key" })}.${encode(payload)}`;
    const signature = new Uint8Array(
      await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        keys.privateKey,
        new TextEncoder().encode(signed),
      ),
    );
    if (pending.forged) signature[0] ^= 1;
    return Response.json({
      token_type: "Bearer",
      access_token: "disposable-access-token",
      expires_in: 300,
      id_token: `${signed}.${Buffer.from(signature).toString("base64url")}`,
    });
  };
  return {
    config,
    get tokenRequests() {
      return tokenRequests;
    },
    authorize(authorization: URL, claims: Record<string, unknown> = {}, forged = false) {
      const code = crypto.randomUUID();
      codes.set(code, { authorization, claims, forged });
      const url = new URL(authorization.searchParams.get("redirect_uri")!);
      url.searchParams.set("state", authorization.searchParams.get("state")!);
      url.searchParams.set("code", code);
      url.searchParams.set("iss", GOOGLE_ISSUER);
      return url;
    },
  };
}
