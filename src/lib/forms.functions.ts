import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { store } from "@/db/store.server";
import { escapeHtml, sendEmail } from "./email.server";

const contactSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(4000),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }) => {
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

    return { ok: true as const, id: row.id };
  });

const newsletterSchema = z.object({
  email: z.string().trim().email().max(255),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => newsletterSchema.parse(data))
  .handler(async ({ data }) => {
    const { created } = store.insertSubscriber(data.email);
    return { ok: true as const, alreadySubscribed: !created };
  });
