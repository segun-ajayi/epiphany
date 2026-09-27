import { createFileRoute } from "@tanstack/react-router";
import { handleAdminGivingMedia } from "@/lib/giving/http.server";

export const Route = createFileRoute("/api/admin/giving-media")({
  server: { handlers: { ANY: ({ request }) => handleAdminGivingMedia(request) } },
});
