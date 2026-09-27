import { createFileRoute } from "@tanstack/react-router";
import { handleAdminRegistrations } from "@/lib/registrations/http.server";

export const Route = createFileRoute("/api/admin/registrations")({
  server: { handlers: { ANY: ({ request }) => handleAdminRegistrations(request) } },
});
