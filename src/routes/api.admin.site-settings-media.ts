import { createFileRoute } from "@tanstack/react-router";
import { handleAdminSiteSettingsMedia } from "@/lib/site-settings/http.server";

export const Route = createFileRoute("/api/admin/site-settings-media")({
  server: { handlers: { ANY: ({ request }) => handleAdminSiteSettingsMedia(request) } },
});
