import { signOut, verifySession } from "../../src/lib/auth/session.server.ts";
import { handleAuth } from "../../src/lib/auth/http.server.ts";
import { readSessionCookie } from "../../src/lib/auth/cookies.server.ts";
import { attachDatabase } from "../../src/lib/db/runtime.server.ts";
import { saveAdminContent } from "../../src/lib/admin/repository.server.ts";
import type { SqlDatabase } from "../../src/lib/db/sql.types.ts";
import { fakeGoogle } from "./google-provider.ts";

// Disposable LOCAL D1 database only. Never deploy this unprotected test worker.
export default {
  async fetch(request: Request, env: { DB: SqlDatabase }) {
    const origin = new URL(request.url).origin;
    if (new URL(request.url).hostname !== "127.0.0.1") return new Response(null, { status: 403 });
    const db = env.DB;
    const id = crypto.randomUUID();
    const email = `${id}@gmail.com`;
    await db
      .prepare("INSERT INTO admin_users (id,email,role,active) VALUES (?,?,'administrator',1)")
      .bind(id, email)
      .run();
    const provider = await fakeGoogle();
    const start = new Request(origin + "/api/admin/auth/google", {
      method: "POST",
      headers: { origin, "content-type": "application/json", "x-admin-request": "1" },
      body: "{}",
    });
    attachDatabase(start, db, origin);
    const began = await handleAuth(start, "google", provider.config);
    const url = new URL(((await began.json()) as { url: string }).url);
    const callback = new Request(provider.authorize(url, { sub: id, email }), {
      headers: { cookie: began.headers.get("set-cookie")!.split(";")[0] },
    });
    attachDatabase(callback, db, origin);
    const loggedIn = await handleAuth(callback, "google-callback", provider.config);
    if (loggedIn.headers.get("location") !== "/admin") throw new Error("Signed callback failed");
    const cookie = loggedIn.headers
      .getSetCookie()
      .find((value) => value.startsWith("epiphany_session="))!
      .split(";")[0];
    const token = readSessionCookie(new Request(origin, { headers: { cookie } }), origin);
    const user = await verifySession(db, token);
    const record = {
      slug: `test-${id}`,
      name: "Disposable D1 ministry",
      summary: "Local fixture",
      description: "Never production",
      status: "draft",
      display_order: 0,
    };
    const draft = await saveAdminContent(db, user, { kind: "ministry", record });
    const published = await saveAdminContent(db, user, {
      kind: "ministry",
      ...draft,
      record: { ...record, status: "published" },
    });
    const archived = await saveAdminContent(db, user, {
      kind: "ministry",
      ...published,
      record: { ...record, status: "archived" },
    });
    const replay = await handleAuth(callback, "google-callback", provider.config);
    await signOut(db, token);
    let loggedOut = false;
    try {
      await verifySession(db, token);
    } catch {
      loggedOut = true;
    }
    const audit = await db
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE actor_id=?")
      .bind(id)
      .first<{ n: number }>();
    if (
      !loggedOut ||
      archived.revision !== 3 ||
      audit?.n !== 5 ||
      replay.headers.get("location") !== "/admin?signin=expired"
    )
      throw new Error("D1 rehearsal assertion failed");
    return Response.json({
      passed: true,
      signedGoogleFixture: true,
      publishAndArchive: true,
      replayBlocked: true,
      loggedOut,
      auditEntries: audit.n,
    });
  },
};
