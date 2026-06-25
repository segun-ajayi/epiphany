// Email service helper. Uses Resend when RESEND_API_KEY is configured,
// otherwise logs the message to the console so local/dev builds never break.

import { Resend } from "resend";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<
  | { ok: true; id: string; provider: "resend" | "console" }
  | { ok: false; error: string }
> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL || "Epiphany <onboarding@resend.dev>";

  if (!apiKey) {
    console.log("[email:console-fallback]", {
      from,
      to: input.to,
      subject: input.subject,
      replyTo: input.replyTo,
      htmlPreview: input.html.slice(0, 240),
    });
    return { ok: true, id: `console-${Date.now()}`, provider: "console" };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    });
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true, id: result.data?.id ?? "", provider: "resend" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown email error" };
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
