import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, MapPin, Play, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NewsletterSignup } from "@/components/newsletter-signup";
import {
  getPublicEvents,
  getPublicMinistries,
  getPublicSermons,
} from "@/lib/api/content.functions";
import { formatEventDate, formatEventTime } from "@/lib/content/event-format";
import { IMAGES } from "@/data/church";
import { formatSiteAddress } from "@/lib/site-settings/schemas";
import { absoluteUrl, SITE } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [ministries, events, sermons] = await Promise.all([
      getPublicMinistries(),
      getPublicEvents(),
      getPublicSermons(),
    ]);
    return { ministries, events, sermons };
  },
  head: () => ({
    meta: [
      { title: "Anglican Church of the Epiphany | Houston, TX" },
      {
        name: "description",
        content:
          "Anglican Church of the Epiphany in Houston, Texas. Plan your visit, watch sermons, and join a community growing in faith and worship.",
      },
      { property: "og:title", content: "Anglican Church of the Epiphany — Houston, TX" },
      {
        property: "og:description",
        content: "Growing in faith, worship, and community in Houston, Texas.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE.origin },
      { property: "og:image", content: absoluteUrl(IMAGES.heroChurch) },
    ],
    links: [{ rel: "canonical", href: SITE.origin }],
  }),
  component: Home,
});

const rootRoute = getRouteApi("__root__");

function Home() {
  const { ministries, events, sermons } = Route.useLoaderData();
  const { siteSettings } = rootRoute.useLoaderData();
  const address = formatSiteAddress(siteSettings);
  return (
    <>
      {/* HERO */}
      <section className="relative -mt-16 md:-mt-20 min-h-[88vh] flex items-end overflow-hidden">
        <img
          src={siteSettings.home.heroImagePath || IMAGES.heroChurch}
          alt="Sanctuary interior of Anglican Church of Epiphany"
          width={1920}
          height={1280}
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/70 to-[#0F172A]/30"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(212,175,55,0.25),transparent_55%)]"
          aria-hidden
        />

        <div className="container-page relative z-10 pb-20 pt-32 md:pb-28 md:pt-40 text-primary-foreground">
          <p className="inline-flex items-center gap-2 text-xs md:text-sm uppercase tracking-[0.32em] text-gold">
            <Sparkles className="size-4" /> {siteSettings.shortName}
          </p>
          <h1 className="mt-5 font-display text-xl sm:text-3xl md:text-5xl leading-[1.05] text-balance max-w-6xl">
            Welcome to <span className="text-gold">{siteSettings.churchName}</span>
          </h1>
          <p className="mt-6 text-base md:text-sm max-w-2xl opacity-90">
            {siteSettings.home.heroIntro}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="default">
              <Link to="/visit">
                Plan Your Visit <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghostLight">
              <Link to="/sermons">
                <Play className="size-4" /> Watch Sermons
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghostLight">
              <Link to="/give">
                <Heart className="size-4" /> Give Online
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* WELCOME */}
      <section className="container-page py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy font-semibold">
              {siteSettings.home.welcomeEyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl text-balance">
              {siteSettings.home.welcomeTitle}
            </h2>
            {siteSettings.home.welcomeBody.split(/\n\s*\n/).map((paragraph, index) => (
              <p key={index} className="mt-6 text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
            <p className="mt-6 text-muted-foreground leading-relaxed">
              {siteSettings.home.welcomeName}
              {siteSettings.home.welcomeRole.split("\n").map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <Button asChild className="mt-8" variant="outline">
              <Link to="/about">
                Learn our story <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="relative">
            <div
              className="absolute -inset-4 bg-gradient-to-br from-gold/20 to-burgundy/10 rounded-3xl blur-2xl"
              aria-hidden
            />
            <img
              src={siteSettings.home.welcomeImagePath || IMAGES.churchExterior}
              alt="Exterior of the church"
              loading="lazy"
              width={1280}
              height={960}
              className="relative rounded-2xl shadow-elegant w-full aspect-[4/3] object-cover"
            />
          </div>
        </div>
      </section>

      {/* SERVICE TIMES */}
      <section className="bg-primary text-primary-foreground py-20 md:py-28">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">
              {siteSettings.home.servicesEyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl">
              {siteSettings.home.servicesTitle}
            </h2>
            <p className="mt-4 opacity-80">{siteSettings.home.servicesIntro}</p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {siteSettings.serviceTimes.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-7 hover:bg-white/10 transition"
              >
                <p className="text-gold text-xs uppercase tracking-[0.22em]">{s.day}</p>
                <p className="mt-2 font-display text-3xl">{s.time}</p>
                <p className="mt-3 text-lg">{s.title}</p>
                <p className="mt-2 text-sm opacity-75">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="hero" size="lg">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin className="size-4" /> Get Directions
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* MINISTRIES */}
      <section className="container-page py-20 md:py-28">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy">
              {siteSettings.home.ministriesEyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl md:text-5xl">
              {siteSettings.home.ministriesTitle}
            </h2>
          </div>
          <Button asChild variant="link">
            <Link to="/ministries">
              View all ministries <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ministries.slice(0, 6).map((m) => (
            <Link key={m.id} to="/ministries/$id" params={{ id: m.slug }} className="group">
              <Card className="overflow-hidden h-full transition-all hover:shadow-elegant hover:-translate-y-1">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={m.image}
                    alt={m.imageAlt}
                    loading="lazy"
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-display text-xl">{m.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{m.summary}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* EVENTS */}
      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container-page">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-burgundy">
                {siteSettings.home.eventsEyebrow}
              </p>
              <h2 className="mt-2 font-display text-3xl md:text-5xl">
                {siteSettings.home.eventsTitle}
              </h2>
            </div>
            <Button asChild variant="link">
              <Link to="/events">
                All events <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {events.slice(0, 3).map((e) => (
              <Link key={e.id} to="/events/$id" params={{ id: e.slug }} className="group">
                <Card className="overflow-hidden h-full">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={e.image}
                      alt={e.imageAlt}
                      loading="lazy"
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <CardContent className="p-6">
                    <p className="text-xs uppercase tracking-widest text-burgundy font-semibold">
                      {e.category}
                    </p>
                    <h3 className="mt-2 font-display text-xl">{e.title}</h3>
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="size-4" />
                      {formatEventDate(e)} · {formatEventTime(e)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {events.length === 0 && (
              <div className="md:col-span-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <h3 className="font-display text-2xl">No upcoming events yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  New gatherings will appear here as soon as they are published.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SERMONS */}
      <section className="container-page py-20 md:py-28">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy">
              {siteSettings.home.sermonsEyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl md:text-5xl">
              {siteSettings.home.sermonsTitle}
            </h2>
          </div>
          <Button asChild variant="link">
            <Link to="/sermons">
              Sermon library <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {sermons.slice(0, 3).map((s) => (
            <Link key={s.id} to="/sermons/$id" params={{ id: s.slug }} className="group">
              <Card className="overflow-hidden h-full">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.imageAlt}
                    loading="lazy"
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                    <span className="size-14 rounded-full bg-gold text-gold-foreground grid place-items-center">
                      <Play className="size-5 ml-0.5" />
                    </span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-xs text-muted-foreground">
                    {s.scripture} ·{" "}
                    {new Date(`${s.sermonDate}T00:00:00`).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <h3 className="mt-2 font-display text-xl">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.speaker}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
          {sermons.length === 0 && (
            <div className="md:col-span-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <h3 className="font-display text-2xl">Sermons are being prepared</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Published recordings and notes will appear here when they are ready.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* GIVING BANNER */}
      <section className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-[#152a4a] text-primary-foreground p-10 md:p-16">
          <div
            className="absolute -right-20 -bottom-20 size-80 rounded-full bg-gold/20 blur-3xl"
            aria-hidden
          />
          <div className="relative max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">
              {siteSettings.home.givingEyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl">
              {siteSettings.home.givingTitle}
            </h2>
            <p className="mt-4 opacity-90">{siteSettings.home.givingBody}</p>
            <Button asChild size="lg" variant="hero" className="mt-8">
              <Link to="/give">
                <Heart className="size-4" /> Give Online
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {siteSettings.home.testimonials.length > 0 && (
        <section className="container-page py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy">
              {siteSettings.home.testimonialsEyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl">
              {siteSettings.home.testimonialsTitle}
            </h2>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {siteSettings.home.testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="p-7">
                <p className="text-5xl font-display text-gold leading-none">"</p>
                <p className="text-foreground leading-relaxed">{testimonial.quote}</p>
                <p className="mt-6 text-sm font-medium text-muted-foreground">
                  — {testimonial.name}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <NewsletterSignup />
    </>
  );
}
