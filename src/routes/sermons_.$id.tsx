import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";

import { SermonMediaActions } from "@/components/sermon-media";
import { Button } from "@/components/ui/button";
import { getPublicSermon, getPublicSermons } from "@/lib/api/content.functions";
import { getPublicSiteSettings } from "@/lib/api/site-settings.functions";
import { absoluteUrl, safeJsonLd, SITE } from "@/lib/seo";

export const Route = createFileRoute("/sermons_/$id")({
  loader: async ({ params }) => {
    const [sermon, sermons, siteSettings] = await Promise.all([
      getPublicSermon({ data: { slug: params.id } }),
      getPublicSermons(),
      getPublicSiteSettings(),
    ]);
    if (!sermon) throw notFound();
    return { sermon, sermons, siteSettings };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { sermon, siteSettings } = loaderData;
    const sermonUrl = absoluteUrl(`/sermons/${encodeURIComponent(sermon.slug)}`);
    const imageUrl = absoluteUrl(sermon.image);
    const description = sermon.seoDescription || sermon.summary;
    const duration = sermon.durationSeconds
      ? `PT${Math.floor(sermon.durationSeconds / 60)}M${sermon.durationSeconds % 60}S`
      : undefined;
    return {
      meta: [
        { title: sermon.seoTitle || `${sermon.title} — Sermons` },
        { name: "description", content: description },
        { property: "og:title", content: sermon.title },
        { property: "og:description", content: description },
        { property: "og:url", content: sermonUrl },
        { property: "og:image", content: imageUrl },
        { property: "og:image:alt", content: sermon.imageAlt },
        { property: "og:type", content: "video.other" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: sermonUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: safeJsonLd({
            "@context": "https://schema.org",
            "@type": sermon.youtubeUrl ? "VideoObject" : "AudioObject",
            "@id": `${sermonUrl}#recording`,
            name: sermon.title,
            description,
            thumbnailUrl: [imageUrl],
            uploadDate: sermon.sermonDate,
            duration,
            contentUrl: sermon.youtubeUrl || sermon.audioUrl,
            url: sermonUrl,
            author: { "@type": "Person", name: sermon.speaker },
            publisher: {
              "@type": "Church",
              "@id": `${SITE.origin}/#organization`,
              name: siteSettings.churchName,
              url: SITE.origin,
            },
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-page py-32 text-center">
      <h1 className="font-display text-3xl">Sermon not found</h1>
      <Button asChild className="mt-6">
        <Link to="/sermons">Back to sermons</Link>
      </Button>
    </div>
  ),
  errorComponent: () => (
    <div className="container-page py-32 text-center">
      <h1 className="font-display text-3xl">Sermons are temporarily unavailable</h1>
      <Button asChild className="mt-6">
        <Link to="/sermons">Back to sermons</Link>
      </Button>
    </div>
  ),
  component: SermonDetail,
});

function SermonDetail() {
  const { sermon, sermons } = Route.useLoaderData();
  const related = sermons
    .filter((item) => sermon.series && item.series === sermon.series && item.id !== sermon.id)
    .slice(0, 4);
  return (
    <article className="container-page py-12 md:py-20">
      <Button asChild variant="ghost" size="sm">
        <Link to="/sermons">
          <ArrowLeft className="size-4" /> All sermons
        </Link>
      </Button>
      <div className="mt-8 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-primary">
            <img src={sermon.image} alt={sermon.imageAlt} className="size-full object-cover" />
          </div>
          {(sermon.series || sermon.topic) && (
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-burgundy">
              {[sermon.series, sermon.topic].filter(Boolean).join(" · ")}
            </p>
          )}
          <h1 className="mt-3 font-display text-4xl md:text-5xl">{sermon.title}</h1>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <User className="size-4 text-gold" /> {sermon.speaker}
            </p>
            <p className="flex items-center gap-2">
              <Calendar className="size-4 text-gold" />
              {new Intl.DateTimeFormat("en-US", {
                timeZone: "UTC",
                month: "long",
                day: "numeric",
                year: "numeric",
              }).format(new Date(`${sermon.sermonDate}T00:00:00Z`))}
            </p>
            {sermon.durationSeconds && (
              <p className="flex items-center gap-2">
                <Clock className="size-4 text-gold" />
                {Math.ceil(sermon.durationSeconds / 60)} minutes
              </p>
            )}
          </div>
          <p className="mt-4 font-medium italic">{sermon.scripture}</p>
          <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
            {sermon.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <SermonMediaActions sermon={sermon} />
          </div>
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-xl">
            {sermon.series ? `More in ${sermon.series}` : "More sermons"}
          </h2>
          {related.length ? (
            <ul className="mt-4 space-y-3">
              {related.map((item) => (
                <li key={item.id}>
                  <Link
                    to="/sermons/$id"
                    params={{ id: item.slug }}
                    className="block text-sm hover:text-gold"
                  >
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.speaker}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No other published sermons in this series yet.
            </p>
          )}
        </aside>
      </div>
    </article>
  );
}
