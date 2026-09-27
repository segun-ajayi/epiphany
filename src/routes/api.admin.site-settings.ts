import { createFileRoute } from "@tanstack/react-router";
import { handleAdminSiteSettings } from "@/lib/site-settings/http.server";

export const Route = createFileRoute("/api/admin/site-settings")({
  server: { handlers: { ANY: ({ request }) => handleAdminSiteSettings(request) } },
});
