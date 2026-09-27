import { createFileRoute } from "@tanstack/react-router";
import { handlePublicMedia } from "@/lib/admin/media.server";

export const Route = createFileRoute("/media/$id")({
  server: {
    handlers: {
      ANY: ({ request, params }) => handlePublicMedia(request, params.id),
    },
  },
});
