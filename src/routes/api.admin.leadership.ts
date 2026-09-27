import { createFileRoute } from "@tanstack/react-router";
import { handleAdminLeadership } from "@/lib/leadership/http.server";

export const Route = createFileRoute("/api/admin/leadership")({
  server: { handlers: { ANY: ({ request }) => handleAdminLeadership(request) } },
});
