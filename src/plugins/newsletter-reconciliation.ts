import { definePlugin } from "nitro";
import { bindHostRuntime, getAuthOriginSetting, getDatabase } from "../lib/db/runtime.server";
import { getNewsletterProviderConfig } from "../lib/newsletter/providers.server";
import { runAutomaticNewsletterReconciliation } from "../lib/newsletter/sync.server";
import { processEventNewsletterCampaigns } from "../lib/newsletter/workflow.server";

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook("cloudflare:scheduled", async ({ controller, env, context }) => {
    const request = new Request("https://newsletter-reconciliation.internal/");
    bindHostRuntime(request, env, context);
    const db = await getDatabase(request);
    const config = getNewsletterProviderConfig(request);
    if (controller.cron === "*/5 * * * *") {
      const delivery = await processEventNewsletterCampaigns(
        db,
        config,
        getAuthOriginSetting(request) || "https://acehou.org",
      );
      console.log("Event newsletter workflow completed.", {
        ok: delivery.ok,
        processed: "processed" in delivery ? delivery.processed : 0,
        sent: "sent" in delivery ? delivery.sent : 0,
        failed: "failed" in delivery ? delivery.failed : 0,
      });
      return;
    }
    const result = await runAutomaticNewsletterReconciliation(db, config);
    console.log("Newsletter automatic reconciliation completed.", {
      ok: result.ok,
      skipped: "skipped" in result ? result.skipped : false,
      processed: "processed" in result ? result.processed : 0,
      suppressed: "suppressed" in result ? result.suppressed : 0,
      failed: "failed" in result ? result.failed : 0,
    });
  });
});
