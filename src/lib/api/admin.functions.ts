import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { loadAdminScreen } from "../admin/http.server";
import { ADMIN_HEADERS } from "../admin/headers";
import type { AdminContent } from "../admin/repository.server";

type AdminScreen = Awaited<ReturnType<typeof loadAdminScreen>>;

// Client navigation uses the session-protected API, never a public server-function URL.
export const getAdminScreen = createIsomorphicFn()
  .server(async (): Promise<AdminScreen> => {
    for (const [key, value] of Object.entries(ADMIN_HEADERS)) setResponseHeader(key, value);
    // The document can render a no-data access notice; the API uses 401/403/503.
    return loadAdminScreen(getRequest());
  })
  .client(async (): Promise<AdminScreen> => {
    try {
      const response = await fetch("/api/admin/content", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (response.headers.get("content-type")?.includes("application/json")) {
        const body = await response.json();
        if (response.ok) return { state: "ready", data: body as AdminContent };
        return {
          state: "blocked",
          error: { status: response.status, code: body.code, message: body.error },
        };
      }
    } catch {
      /* A failed connection must never leave the page appearing authenticated. */
    }
    return {
      state: "blocked",
      error: {
        status: 401,
        code: "unauthenticated",
        message: "Unable to load administration. Please reload and sign in again.",
      },
    };
  });
