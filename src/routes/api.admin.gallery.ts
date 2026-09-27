import { createFileRoute } from "@tanstack/react-router";
import { handleAdminGallery } from "@/lib/gallery/http.server";

export const Route = createFileRoute("/api/admin/gallery")({
  server: { handlers: { ANY: ({ request }) => handleAdminGallery(request) } },
});
