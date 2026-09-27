import { createFileRoute } from "@tanstack/react-router";
import { handleNewsletterSignup } from "@/lib/newsletter/http.server";

export const Route = createFileRoute("/api/newsletter")({
  server: {
    handlers: {
      ANY: ({ request }) => handleNewsletterSignup(request),
    },
  },
});
