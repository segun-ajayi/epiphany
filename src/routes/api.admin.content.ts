import { createFileRoute } from "@tanstack/react-router";
import { handleAdminContent } from "@/lib/admin/http.server";

export const Route = createFileRoute("/api/admin/content")({
  server: {
    handlers: {
      ANY: ({ request }) => handleAdminContent(request),
    },
  },
});
