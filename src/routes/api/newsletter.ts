import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { store } from "@/db/store.server";

const schema = z.object({ email: z.string().trim().email().max(255) });

export const Route = createFileRoute("/api/newsletter")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ ok: false, error: "Invalid email" }, { status: 422 });
        }
        const { created } = await store.insertSubscriber(parsed.data.email);
        return Response.json({ ok: true, alreadySubscribed: !created });
      },
    },
  },
});
