import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getEnv } from "@/lib/env.server";
import { store } from "@/db/store.server";
import { escapeHtml, sendEmail } from "@/lib/email.server";
import { contactNotificationTemplate } from "@/emails/contact-notification";

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
        const row = await store.insertMessage({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || null,
          subject: data.subject || null,
          message: data.message,
        });

        const adminEmail = getEnv("ADMIN_EMAIL");
        if (adminEmail) {
          const result = await sendEmail({
            to: adminEmail,
            replyTo: data.email,
            subject: `New contact message: ${data.subject || "(no subject)"}`,
            html: contactNotificationTemplate(data),
          });
          console.log("EMAIL RESULT:", result);
        }
        return Response.json({ ok: true, id: row.id });
      },
    },
  },
});
