import { createServerFn } from "@tanstack/react-start";
import { getContentDatabase } from "@/lib/db/d1.server";
import { loadSiteSettings } from "@/lib/site-settings/repository.server";

export const getPublicSiteSettings = createServerFn({ method: "GET" }).handler(async () =>
  loadSiteSettings(await getContentDatabase()),
);
