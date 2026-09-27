import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, MapPin, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/data/church";
import { getPublicMinistries } from "@/lib/api/content.functions";
import { PageHero } from "./about";
import { absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/ministries")({
  loader: () => getPublicMinistries(),
  head: () => ({
    meta: [
      { title: "Ministries — Anglican Church of Epiphany" },
      {
        name: "description",
        content:
          "Find your place at Epiphany: children's, youth, men's, women's, prayer, choir, outreach, and Bible study ministries.",
      },
      { property: "og:url", content: absoluteUrl("/ministries") },
      { property: "og:image", content: absoluteUrl(IMAGES.congregation) },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/ministries") }],
  }),
  component: MinistriesPage,
});

function MinistriesPage() {
  const ministries = Route.useLoaderData();
  const { siteSettings } = getRouteApi("__root__").useLoaderData();
  const hero = siteSettings.pages.ministries;
  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        subtitle={hero.subtitle}
        image={hero.imagePath || IMAGES.congregation}
      />
      <section className="container-page py-20 md:py-28">
        {!ministries.length && (
          <p className="text-center text-muted-foreground">
            Ministry information will be published here soon.
          </p>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ministries.map((m) => (
            <Card
              key={m.id}
              className="overflow-hidden flex flex-col h-full hover:shadow-elegant transition-all"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={m.image}
                  alt={m.imageAlt}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>
              <CardContent className="p-6 flex-1 flex flex-col">
                <h3 className="font-display text-xl">{m.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{m.summary}</p>
                {(m.meetingSchedule || m.leaderName || m.meetingLocation) && (
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {m.meetingSchedule && (
                      <p className="flex items-center gap-2">
                        <Clock className="size-4 text-gold" /> {m.meetingSchedule}
                      </p>
                    )}
                    {m.leaderName && (
                      <p className="flex items-center gap-2">
                        <User className="size-4 text-gold" /> {m.leaderName}
                      </p>
                    )}
                    {m.meetingLocation && (
                      <p className="flex items-center gap-2">
                        <MapPin className="size-4 text-gold" /> {m.meetingLocation}
                      </p>
                    )}
                  </div>
                )}
                <Button asChild size="sm" variant="outline" className="mt-6 self-start">
                  <Link to="/ministries/$id" params={{ id: m.slug }}>
                    Learn more <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
