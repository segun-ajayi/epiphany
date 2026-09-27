import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  listPublishedEvents,
  listPublishedMinistries,
  listPublishedSermons,
  listPublishedGalleryAlbums,
} from "@/lib/content/public.repository.server";
import { absoluteUrl } from "@/lib/seo";

const STATIC_PATHS = [
  "/",
  "/visit",
  "/about",
  "/ministries",
  "/events",
  "/gallery",
  "/give",
  "/contact",
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        let events: Awaited<ReturnType<typeof listPublishedEvents>> = [];
        let ministries: Awaited<ReturnType<typeof listPublishedMinistries>> = [];
        let sermons: Awaited<ReturnType<typeof listPublishedSermons>> = [];
        let albums: Awaited<ReturnType<typeof listPublishedGalleryAlbums>> = [];
        try {
          [events, ministries, sermons, albums] = await Promise.all([
            listPublishedEvents(),
            listPublishedMinistries(),
            listPublishedSermons(),
            listPublishedGalleryAlbums(),
          ]);
        } catch {
          // A temporary content-store failure must not remove the stable pages from the sitemap.
        }
        const staticUrls: Array<{ loc: string; lastmod?: string }> = STATIC_PATHS.map((path) => ({
          loc: absoluteUrl(path),
        }));
        if (sermons.length) staticUrls.push({ loc: absoluteUrl("/sermons") });
        const eventUrls = events.map((event) => ({
          loc: absoluteUrl(`/events/${encodeURIComponent(event.slug)}`),
          lastmod: event.updatedAt,
        }));
        const ministryUrls = ministries.map((ministry) => ({
          loc: absoluteUrl(`/ministries/${encodeURIComponent(ministry.slug)}`),
          lastmod: ministry.updatedAt,
        }));
        const sermonUrls = sermons.map((sermon) => ({
          loc: absoluteUrl(`/sermons/${encodeURIComponent(sermon.slug)}`),
          lastmod: sermon.updatedAt,
        }));
        const albumUrls = albums.map((album) => ({
          loc: absoluteUrl(`/gallery/${encodeURIComponent(album.slug)}`),
          lastmod: album.updatedAt,
        }));
        const urls = [...staticUrls, ...ministryUrls, ...eventUrls, ...sermonUrls, ...albumUrls]
          .map(
            ({ loc, lastmod }) =>
              `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ""}</url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
