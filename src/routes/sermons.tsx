import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calendar, Search } from "lucide-react";

import { PageHero } from "./about";
import { SermonMediaActions } from "@/components/sermon-media";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IMAGES } from "@/data/church";
import { getPublicSermons } from "@/lib/api/content.functions";
import { absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/sermons")({
  loader: () => getPublicSermons(),
  head: ({ loaderData }) => ({
    meta: [
      { title: "Sermons — Anglican Church of Epiphany" },
      {
        name: "description",
        content:
          "Watch and listen to biblical sermons from Anglican Church of the Epiphany in Houston, Texas.",
      },
      ...(!loaderData?.length ? [{ name: "robots", content: "noindex, follow" }] : []),
      { property: "og:url", content: absoluteUrl("/sermons") },
      { property: "og:image", content: absoluteUrl(IMAGES.bible) },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/sermons") }],
  }),
  component: SermonsPage,
});

function formatSermonDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function SermonsPage() {
  const sermons = Route.useLoaderData();
  const { siteSettings } = getRouteApi("__root__").useLoaderData();
  const hero = siteSettings.pages.sermons;
  const [q, setQ] = useState("");
  const [speaker, setSpeaker] = useState("All");
  const [series, setSeries] = useState("All");
  const speakers = useMemo(
    () => ["All", ...Array.from(new Set(sermons.map((sermon) => sermon.speaker)))],
    [sermons],
  );
  const allSeries = useMemo(
    () => [
      "All",
      ...Array.from(new Set(sermons.map((sermon) => sermon.series).filter(Boolean) as string[])),
    ],
    [sermons],
  );
  const filtered = sermons.filter((sermon) => {
    const matchesQuery =
      !q ||
      [sermon.title, sermon.speaker, sermon.topic, sermon.scripture, sermon.series]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase());
    return (
      matchesQuery &&
      (speaker === "All" || sermon.speaker === speaker) &&
      (series === "All" || sermon.series === series)
    );
  });
  const featured = sermons[0];

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        subtitle={hero.subtitle}
        image={hero.imagePath || IMAGES.bible}
      />

      {!featured ? (
        <section className="container-page py-20 text-center md:py-28">
          <h2 className="font-display text-3xl">Sermons will be available soon</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            We are preparing genuine recordings and teaching notes for this library. In the
            meantime, join us in person or explore our upcoming events.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/visit">Plan your visit</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/events">View events</Link>
            </Button>
          </div>
        </section>
      ) : (
        <>
          <section className="container-page py-20">
            <Card className="grid overflow-hidden border-0 bg-primary text-primary-foreground md:grid-cols-2">
              <div className="relative aspect-video md:aspect-auto">
                <img
                  src={featured.image}
                  alt={featured.imageAlt}
                  className="size-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center p-8 md:p-12">
                <p className="text-xs uppercase tracking-[0.28em] text-gold">Latest sermon</p>
                <h2 className="mt-3 font-display text-3xl md:text-4xl">{featured.title}</h2>
                <p className="mt-3 opacity-80">
                  {featured.speaker} · {featured.scripture}
                </p>
                <p className="mt-4 leading-relaxed opacity-90">{featured.summary}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <SermonMediaActions
                    sermon={featured}
                    watchVariant="hero"
                    secondaryVariant="ghostLight"
                  />
                  <Button asChild variant="ghostLight">
                    <Link to="/sermons/$id" params={{ id: featured.slug }}>
                      Read more
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          <section className="container-page">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Search title, speaker, or scripture…"
                  className="pl-10"
                />
              </div>
              <select
                value={speaker}
                onChange={(event) => setSpeaker(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                aria-label="Filter by speaker"
              >
                {speakers.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              <select
                value={series}
                onChange={(event) => setSeries(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                aria-label="Filter by series"
              >
                {allSeries.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </div>

            <div className="mt-10 grid gap-6 pb-20 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((sermon) => (
                <Link
                  key={sermon.id}
                  to="/sermons/$id"
                  params={{ id: sermon.slug }}
                  className="group"
                >
                  <Card className="h-full overflow-hidden">
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={sermon.image}
                        alt={sermon.imageAlt}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {sermon.series && (
                        <span className="absolute left-3 top-3 rounded bg-gold px-2 py-1 text-[10px] uppercase tracking-widest text-gold-foreground">
                          {sermon.series}
                        </span>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="size-3" /> {formatSermonDate(sermon.sermonDate)}
                      </p>
                      <h3 className="mt-2 font-display text-xl">{sermon.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {sermon.speaker} · {sermon.scripture}
                      </p>
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                        {sermon.summary}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {!filtered.length && (
                <p className="col-span-full py-12 text-center text-muted-foreground">
                  No sermons match your filters.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
