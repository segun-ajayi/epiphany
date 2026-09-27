import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getPublishedEvent,
  getPublishedMinistry,
  getPublishedSermon,
  getPublishedGalleryAlbum,
  listPublishedEvents,
  listPublishedMinistries,
  listPublishedSermons,
  listPublishedGalleryAlbums,
} from "@/lib/content/public.repository.server";
import { listPublishedLeaders } from "@/lib/leadership/public.server";

export const getPublicMinistries = createServerFn({ method: "GET" }).handler(() =>
  listPublishedMinistries(),
);

export const getPublicMinistry = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().trim().min(1).max(160) }))
  .handler(({ data }) => getPublishedMinistry(data.slug));

export const getPublicSermons = createServerFn({ method: "GET" }).handler(() =>
  listPublishedSermons(),
);

export const getPublicSermon = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().trim().min(1).max(160) }))
  .handler(({ data }) => getPublishedSermon(data.slug));

export const getPublicEvents = createServerFn({ method: "GET" }).handler(() =>
  listPublishedEvents(),
);

export const getPublicEvent = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().trim().min(1).max(160) }))
  .handler(({ data }) => getPublishedEvent(data.slug));

export const getPublicGalleryAlbums = createServerFn({ method: "GET" }).handler(() =>
  listPublishedGalleryAlbums(),
);

export const getPublicGalleryAlbum = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().trim().min(1).max(160) }))
  .handler(({ data }) => getPublishedGalleryAlbum(data.slug));

export const getPublicLeadership = createServerFn({ method: "GET" }).handler(() =>
  listPublishedLeaders(),
);
