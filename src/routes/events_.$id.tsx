import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Calendar, ExternalLink, MapPin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventRegistrationForm } from "@/components/event-registration-form";
import { getPublicEvent } from "@/lib/api/content.functions";
import { getPublicSiteSettings } from "@/lib/api/site-settings.functions";
import { formatEventDate, formatEventTime } from "@/lib/content/event-format";
import { absoluteUrl, safeJsonLd, SITE } from "@/lib/seo";
import { formatSiteAddress } from "@/lib/site-settings/schemas";

export const Route = createFileRoute("/events_/$id")({
  loader: async ({ params }) => {
    const [event, siteSettings] = await Promise.all([
      getPublicEvent({ data: { slug: params.id } }),
      getPublicSiteSettings(),
    ]);
    if (!event) throw notFound();
    return { event, siteSettings };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const event = loaderData.event;
    const eventUrl = absoluteUrl(`/events/${encodeURIComponent(event.slug)}`);
    const imageUrl = absoluteUrl(event.image);
    const location =
      event.venueName || event.addressLine1
        ? {
            "@type": "Place",
            name: event.venueName || SITE.name,
            address: {
              "@type": "PostalAddress",
              streetAddress: [event.addressLine1, event.addressLine2].filter(Boolean).join(", "),
              addressLocality: event.locality || undefined,
              addressRegion: event.region || undefined,
              postalCode: event.postalCode || undefined,
              addressCountry: event.countryCode || "US",
            },
          }
        : undefined;
    return {
      meta: [
        { title: event.seoTitle || `${event.title} — Events` },
        {
          name: "description",
          content: event.seoDescription || event.summary,
        },
        { property: "og:title", content: event.title },
        { property: "og:description", content: event.seoDescription || event.summary },
        { property: "og:url", content: eventUrl },
        { property: "og:image", content: imageUrl },
        { property: "og:image:alt", content: event.imageAlt },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: eventUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "Event",
            "@id": `${eventUrl}#event`,
            name: event.title,
            description: event.description,
            startDate: event.startsAt,
            endDate: event.endsAt || undefined,
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
            location,
            image: [imageUrl],
            url: eventUrl,
            organizer: {
              "@type": "Organization",
              "@id": `${SITE.origin}/#organization`,
              name: loaderData.siteSettings.churchName,
              url: SITE.origin,
            },
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-page py-32 text-center">
      <h1 className="font-display text-3xl">Event not found</h1>
      <Button asChild className="mt-6">
        <Link to="/events">Back to events</Link>
      </Button>
    </div>
  ),
  errorComponent: () => (
    <div className="container-page py-32 text-center">
      <h1 className="font-display text-3xl">Something went wrong</h1>
      <Button asChild className="mt-6">
        <Link to="/events">Back to events</Link>
      </Button>
    </div>
  ),
  component: EventDetail,
});

function EventDetail() {
  const { event, siteSettings } = Route.useLoaderData();
  const location = [
    event.venueName,
    event.addressLine1,
    event.addressLine2,
    event.locality,
    event.region,
    event.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
  const directionsAddress = location || formatSiteAddress(siteSettings);
  return (
    <article className="container-page py-12 md:py-20">
      <Button asChild variant="ghost" size="sm">
        <Link to="/events">
          <ArrowLeft className="size-4" /> All events
        </Link>
      </Button>
      <div className="mt-8 grid lg:grid-cols-[2fr_1fr] gap-10">
        <div>
          <div className="aspect-[16/9] rounded-2xl overflow-hidden">
            <img src={event.image} alt={event.imageAlt} className="size-full object-cover" />
          </div>
          <p className="mt-6 text-xs uppercase tracking-widest text-burgundy font-semibold">
            {event.category}
          </p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">{event.title}</h1>
          <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Calendar className="size-4 text-gold" />{" "}
              {formatEventDate(event, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              · {formatEventTime(event)}
            </p>
            {location && (
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-gold" /> {location}
              </p>
            )}
          </div>
          <p className="mt-6 text-lg leading-relaxed">{event.description}</p>
          <div className="mt-6 rounded-2xl border border-border bg-secondary p-6 text-center text-muted-foreground">
            <MapPin className="mx-auto size-8 text-gold" aria-hidden />
            <h2 className="mt-3 font-display text-xl text-foreground">Event location</h2>
            <p className="mt-2 text-sm">{directionsAddress}</p>
            <Button asChild className="mt-5" variant="outline">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(directionsAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get directions <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
          <div className="mt-6 flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                navigator.share?.({ title: event.title, url: window.location.href }).catch(() => {})
              }
            >
              <Share2 className="size-4" /> Share
            </Button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 h-fit">
          {event.registrationStatus === "open" ? (
            <EventRegistrationForm
              eventSlug={event.slug}
              eventTitle={event.title}
              capacity={event.capacity}
            />
          ) : event.registrationStatus !== "not_required" ? (
            <div className="rounded-2xl border border-border p-6 bg-card">
              <h2 className="font-display text-xl">Registration</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Registration is currently {event.registrationStatus === "full" ? "full" : "closed"}.
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
