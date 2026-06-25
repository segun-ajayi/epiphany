import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { store } from "@/db/store.server";
import { getAdminSession, isAdminAuthed } from "./admin-session.server";
import { escapeHtml, sendEmail } from "./email.server";

async function requireAdmin() {
  if (!(await isAdminAuthed())) {
    throw new Error("Unauthorized");
  }
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ password: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return { ok: false as const, error: "ADMIN_PASSWORD is not configured." };
    }
    // Constant-time-ish comparison.
    if (data.password.length !== expected.length) {
      return { ok: false as const, error: "Incorrect password." };
    }
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ data.password.charCodeAt(i);
    }
    if (mismatch !== 0) return { ok: false as const, error: "Incorrect password." };

    const session = await getAdminSession();
    await session.update({ isAdmin: true, loggedInAt: Date.now() });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getAdminSession();
  await session.clear();
  return { ok: true as const };
});

export const adminCheck = createServerFn({ method: "GET" }).handler(async () => {
  return { isAdmin: await isAdminAuthed() };
});

export const adminListMessages = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return store.listMessages().map((m) => ({
    ...m,
    createdAt: +m.createdAt,
  }));
});

export const adminUpdateMessageStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({
      id: z.number().int().positive(),
      status: z.enum(["unread", "read", "archived"]),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const m = store.updateMessageStatus(data.id, data.status);
    if (!m) throw new Error("Message not found");
    return { ok: true as const };
  });

export const adminListSubscribers = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return store.listSubscribers().map((s) => ({ ...s, createdAt: +s.createdAt }));
});

export const adminSendBroadcast = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({
      title: z.string().trim().min(1).max(200),
      body: z.string().trim().min(5).max(20000),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const subs = store.listSubscribers();
    if (subs.length === 0) {
      return { ok: true as const, sent: 0, failed: 0, provider: "none" as const };
    }

    const htmlBody = data.body
      .split(/\n{2,}/)
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
      .join("");

    let sent = 0;
    let failed = 0;
    let provider: "resend" | "console" | "mixed" = process.env.RESEND_API_KEY ? "resend" : "console";

    // Sequential to be friendly to Resend's per-second limits.
    for (const sub of subs) {
      const result = await sendEmail({
        to: sub.email,
        subject: data.title,
        html: `
          <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#111">
            <h1 style="font-family:Georgia,serif;color:#5b1a1a">${escapeHtml(data.title)}</h1>
            ${htmlBody}
            <hr style="margin:32px 0;border:none;border-top:1px solid #ddd"/>
            <p style="font-size:12px;color:#666">
              You are receiving this because you subscribed at Anglican Church of Epiphany, Houston.
            </p>
          </div>
        `,
      });
      if (result.ok) {
        sent++;
        if (result.provider !== provider) provider = "mixed";
      } else {
        failed++;
        console.error("[broadcast] send failed", sub.email, result.error);
      }
    }

    return { ok: true as const, sent, failed, provider };
  });
