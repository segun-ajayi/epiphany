import { createFileRoute } from "@tanstack/react-router";
import { handleContactSubmission } from "@/lib/contact/http.server";

export const Route = createFileRoute("/api/contact")({
  server: { handlers: { ANY: ({ request }) => handleContactSubmission(request) } },
});
