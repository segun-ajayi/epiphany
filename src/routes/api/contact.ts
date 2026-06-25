import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { store } from "@/db/store.server";
import { escapeHtml, sendEmail } from "@/lib/email.server";

const schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")).nullable(),
  subject: z.string().trim().max(200).optional().or(z.literal("")).nullable(),
  message: z.string().trim().min(5).max(4000),
});

export const Route = createFileRoute("/api/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ ok: false, error: parsed.error.flatten() }, { status: 422 });
        }
        const data = parsed.data;
        const row = store.insertMessage({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || null,
          subject: data.subject || null,
          message: data.message,
        });

        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          await sendEmail({
            to: adminEmail,
            replyTo: data.email,
            subject: `New contact message: ${data.subject || "(no subject)"}`,
            html: `
              <h2>New message from the Epiphany website</h2>
              <p><b>From:</b> ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)} &lt;${escapeHtml(data.email)}&gt;</p>
              ${data.phone ? `<p><b>Phone:</b> ${escapeHtml(data.phone)}</p>` : ""}
              ${data.subject ? `<p><b>Subject:</b> ${escapeHtml(data.subject)}</p>` : ""}
              <hr/>
              <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
            `,
          });
        }
        return Response.json({ ok: true, id: row.id });
      },
    },
  },
});
