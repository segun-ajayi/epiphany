import { createFileRoute } from "@tanstack/react-router";
import { handleAuth } from "@/lib/auth/http.server";

export const Route = createFileRoute("/api/admin/auth/$action")({
  server: { handlers: { ANY: ({ request, params }) => handleAuth(request, params.action) } },
});
