import { createFileRoute } from "@tanstack/react-router";
import { handleRegistrationSubmission } from "@/lib/registrations/http.server";

export const Route = createFileRoute("/api/registrations")({
  server: { handlers: { ANY: ({ request }) => handleRegistrationSubmission(request) } },
});
