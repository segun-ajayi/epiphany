import { createFileRoute } from "@tanstack/react-router";
import { getDatabase } from "@/lib/db/runtime.server";
import { getActiveNewsletterTemplate } from "@/lib/newsletter/repository.server";
import { newsletterTemplateSchema } from "@/lib/newsletter/schemas";
import { renderNewsletterHtml, WELCOME_NEWSLETTER } from "@/lib/newsletter/templates";

export const Route = createFileRoute("/newsletter_/welcome")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const selected = url.searchParams.get("template");
        const template = selected
          ? newsletterTemplateSchema.parse(selected)
          : await getActiveNewsletterTemplate(await getDatabase(request));
        return new Response(
          renderNewsletterHtml(template, WELCOME_NEWSLETTER, {
            origin: url.origin,
            browserViewUrl: `${url.origin}/newsletter/welcome`,
            mode: "browser",
          }),
          {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": selected ? "private, no-store" : "public, max-age=300",
              "X-Content-Type-Options": "nosniff",
              "X-Robots-Tag": "noindex, follow",
              "Referrer-Policy": "strict-origin-when-cross-origin",
            },
          },
        );
      },
    },
  },
});
