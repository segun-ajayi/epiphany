import { createFileRoute } from "@tanstack/react-router";
import { handleAdminTeam } from "@/lib/team/http.server";

export const Route = createFileRoute("/api/admin/team")({
  server: {
    handlers: {
      ANY: ({ request }) => handleAdminTeam(request),
    },
  },
});
