import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getDatabase } from "../db/runtime.server.ts";
import { loadGivingSettings } from "../giving/repository.server.ts";

export const getPublicGiving = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const data = await loadGivingSettings(await getDatabase(request), request);
  return {
    configured: data.configured,
    setupRequired: data.setupRequired,
    settings: {
      ...data.settings,
      methods: data.settings.methods.filter((method) => method.enabled),
      designations: data.settings.designations.filter((designation) => designation.enabled),
      impactItems: data.settings.impactItems
        .filter((impact) => impact.enabled && impact.reviewedAt)
        .map(({ evidenceNote: _evidenceNote, ...impact }) => impact),
    },
  };
});
