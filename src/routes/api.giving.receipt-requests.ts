import { createFileRoute } from "@tanstack/react-router";
import { handleGivingReceiptRequest } from "@/lib/giving/http.server";

export const Route = createFileRoute("/api/giving/receipt-requests")({
  server: {
    handlers: {
      ANY: ({ request }) => handleGivingReceiptRequest(request),
    },
  },
});
