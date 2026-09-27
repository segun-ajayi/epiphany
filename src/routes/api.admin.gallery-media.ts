import { createFileRoute } from "@tanstack/react-router";
import { handleAdminGalleryMedia } from "@/lib/gallery/http.server";

export const Route = createFileRoute("/api/admin/gallery-media")({
  server: { handlers: { ANY: ({ request }) => handleAdminGalleryMedia(request) } },
});
