import { z } from "zod";
import { ADMIN_HEADERS } from "../admin/headers.ts";
import {
  adminFailure,
  assertSameOriginMutation,
  readLimitedJson,
  requireAdmin,
} from "../admin/http.server.ts";
import { AdminError } from "../auth/permissions.ts";
import { getAuthOriginSetting, getDatabase } from "../db/runtime.server.ts";
import { parseAuthOrigin } from "../auth/cookies.server.ts";
import {
  exportNewsletterCsv,
  loadNewsletterSubscribers,
  subscribeToNewsletter,
  setNewsletterProvider,
  setNewsletterTemplate,
  setEventNewsletterWorkflow,
  updateNewsletterStatus,
} from "./repository.server.ts";
import {
  newsletterAdminMutationSchema,
  newsletterSignupSchema,
  newsletterSyncSchema,
  newsletterTemplateSchema,
} from "./schemas.ts";
import { getNewsletterProviderConfig } from "./providers.server.ts";
import { renderNewsletterHtml, WELCOME_NEWSLETTER } from "./templates.ts";
import {
  reconcileNewsletterBatch,
  syncNewsletterBatch,
  syncSubscriberToActiveProvider,
} from "./sync.server.ts";
import {
  processEventNewsletterCampaigns,
  retryEventNewsletterCampaign,
} from "./workflow.server.ts";

const PUBLIC_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

const publicJson = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: PUBLIC_HEADERS });

export async function handleNewsletterSignup(request: Request) {
  try {
    if (request.method !== "POST") {
      return new Response(null, { status: 405, headers: { ...PUBLIC_HEADERS, Allow: "POST" } });
    }
    const origin = new URL(request.url).origin;
    const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (
      request.headers.get("origin") !== origin ||
      request.headers.get("sec-fetch-site") === "cross-site" ||
      request.headers.get("x-newsletter-request") !== "1" ||
      type !== "application/json"
    ) {
      throw new AdminError(403, "invalid_origin", "Please subscribe from this website.");
    }
    const input = newsletterSignupSchema.parse(await readLimitedJson(request, 8 * 1024));
    const elapsed = Date.now() - input.startedAt;
    if (elapsed < 1500 || elapsed > 24 * 60 * 60 * 1000) {
      throw new AdminError(400, "invalid_timing", "Please refresh the page and try again.");
    }
    // Bots often fill every field. Return the same success shape without retaining their data.
    if (input.website) {
      return publicJson({
        ok: true,
        message: "Thank you — your subscription has been recorded.",
      });
    }
    const db = await getDatabase(request);
    const saved = await subscribeToNewsletter(db, input);
    const sync = await syncSubscriberToActiveProvider(
      db,
      getNewsletterProviderConfig(request),
      saved.subscriber,
    );
    if (!sync.ok) console.error("Newsletter delivery synchronization will be retried.");
    return publicJson({
      ok: true,
      message: "Thank you — your subscription has been recorded.",
    });
  } catch (error) {
    if (error instanceof AdminError) {
      return publicJson({ error: error.message, code: error.code }, error.status);
    }
    if (error instanceof z.ZodError) {
      return publicJson(
        { error: "Please enter a valid email and confirm your subscription.", code: "validation" },
        400,
      );
    }
    console.error("Newsletter signup failed.");
    return publicJson(
      { error: "We could not save your subscription. Please try again.", code: "unavailable" },
      503,
    );
  }
}

export async function handleAdminNewsletter(request: Request) {
  const json = (data: unknown, status = 200) =>
    Response.json(data, { status, headers: ADMIN_HEADERS });
  try {
    if (!["GET", "POST", "PATCH"].includes(request.method)) {
      return new Response(null, {
        status: 405,
        headers: { ...ADMIN_HEADERS, Allow: "GET, POST, PATCH" },
      });
    }
    if (request.method !== "GET") {
      assertSameOriginMutation(request, parseAuthOrigin(getAuthOriginSetting(request), request));
    }
    const { db, user } = await requireAdmin(request);
    const url = new URL(request.url);
    if (request.method === "GET" && url.searchParams.get("format") === "csv") {
      const csv = await exportNewsletterCsv(db, user);
      const date = new Date().toISOString().slice(0, 10);
      return new Response(csv, {
        headers: {
          ...ADMIN_HEADERS,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="epiphany-newsletter-${date}.csv"`,
        },
      });
    }
    if (request.method === "GET" && url.searchParams.get("format") === "html") {
      const data = await loadNewsletterSubscribers(
        db,
        user,
        0,
        getNewsletterProviderConfig(request).availability,
      );
      const template = newsletterTemplateSchema.parse(
        url.searchParams.get("template") ?? data.delivery.activeTemplate,
      );
      const html = renderNewsletterHtml(template, WELCOME_NEWSLETTER, {
        origin: url.origin,
        mode: "email",
      });
      return new Response(html, {
        headers: {
          ...ADMIN_HEADERS,
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="epiphany-welcome-${template}.html"`,
        },
      });
    }
    if (request.method === "GET") {
      const page = z.coerce
        .number()
        .int()
        .min(0)
        .max(10000)
        .parse(url.searchParams.get("page") ?? 0);
      return json(
        await loadNewsletterSubscribers(
          db,
          user,
          page,
          getNewsletterProviderConfig(request).availability,
        ),
      );
    }
    const body = await readLimitedJson(request, 8 * 1024);
    const providerConfig = getNewsletterProviderConfig(request);
    if (request.method === "POST") {
      const operation = newsletterSyncSchema.parse(body);
      if (operation.action === "deliver-campaign") {
        await retryEventNewsletterCampaign(db, user, operation.id);
        return json(
          await processEventNewsletterCampaigns(db, providerConfig, url.origin, 1, operation.id),
        );
      }
      return json(
        operation.action === "sync"
          ? await syncNewsletterBatch(db, providerConfig)
          : await reconcileNewsletterBatch(db, user, providerConfig),
      );
    }
    const mutation = newsletterAdminMutationSchema.parse(body);
    if (mutation.action === "delivery-provider") {
      return json(
        await setNewsletterProvider(db, user, mutation.provider, providerConfig.availability),
      );
    }
    if (mutation.action === "newsletter-template") {
      return json(await setNewsletterTemplate(db, user, mutation.template));
    }
    if (mutation.action === "event-workflow") {
      return json(await setEventNewsletterWorkflow(db, user, mutation.enabled));
    }
    const result = await updateNewsletterStatus(db, user, {
      id: mutation.id,
      status: mutation.status,
    });
    const sync = result.subscriber
      ? await syncSubscriberToActiveProvider(db, providerConfig, result.subscriber)
      : { ok: true as const, skipped: true as const };
    return json({ ok: true, deliveryWarning: sync.ok ? null : sync.error });
  } catch (error) {
    const failure = adminFailure(error);
    return json({ error: failure.message, code: failure.code }, failure.status);
  }
}
