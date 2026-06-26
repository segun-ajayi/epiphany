import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getEnv } from "./env.server";
import { store } from "@/db/store.server";
import { escapeHtml, sendEmail } from "./email.server";
import { newsletterWelcomeTemplate } from "@/emails/newsletter-welcome";
import { contactNotificationTemplate } from "@/emails/contact-notification.ts";

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
    const row = await store.insertMessage({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
      status: "unread",
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

    return { ok: true as const, id: row.id };
  });

const newsletterSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => newsletterSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const { created, row } = await store.insertSubscriber(data.email);

      // Optional welcome email for first-time subscribers
      if (created) {
        const result = await sendEmail({
          to: row.email,
          subject: "Welcome to the Epiphany Newsletter",
          html: newsletterWelcomeTemplate(data),
        });
        console.log("EMAIL RESULT:", result);
      }

      return {
        ok: true as const,
        alreadySubscribed: !created,
      };
    } catch (error) {
      console.error("[newsletter]", error);

      throw new Error("Unable to subscribe at this time.");
    }
  });
