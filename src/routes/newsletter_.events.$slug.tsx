import { createFileRoute } from "@tanstack/react-router";
import { getDatabase } from "@/lib/db/runtime.server";
import { renderEventNewsletterBrowserView } from "@/lib/newsletter/workflow.server";

export const Route = createFileRoute("/newsletter_/events/$slug")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(params.slug)) {
          return new Response("Not found", { status: 404 });
        }
        const url = new URL(request.url);
        const html = await renderEventNewsletterBrowserView(
          await getDatabase(request),
          params.slug,
          url.origin,
        );
        if (!html) return new Response("Not found", { status: 404 });
        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=300",
            "X-Content-Type-Options": "nosniff",
            "X-Robots-Tag": "noindex, follow",
            "Referrer-Policy": "strict-origin-when-cross-origin",
          },
        });
      },
    },
  },
});
