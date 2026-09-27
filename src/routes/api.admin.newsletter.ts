import { createFileRoute } from "@tanstack/react-router";
import { handleAdminNewsletter } from "@/lib/newsletter/http.server";

export const Route = createFileRoute("/api/admin/newsletter")({
  server: {
    handlers: {
      ANY: ({ request }) => handleAdminNewsletter(request),
    },
  },
});
