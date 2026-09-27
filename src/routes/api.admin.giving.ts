import { createFileRoute } from "@tanstack/react-router";
import { handleAdminGiving } from "@/lib/giving/http.server";

export const Route = createFileRoute("/api/admin/giving")({
  server: {
    handlers: {
      ANY: ({ request }) => handleAdminGiving(request),
    },
  },
});
