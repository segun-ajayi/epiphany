import { createFileRoute } from "@tanstack/react-router";
import { handleAdminContact } from "@/lib/contact/http.server";

export const Route = createFileRoute("/api/admin/contact")({
  server: { handlers: { ANY: ({ request }) => handleAdminContact(request) } },
});
