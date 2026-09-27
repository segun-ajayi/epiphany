import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock, Mail, MapPin, Phone, User, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPublicMinistry } from "@/lib/api/content.functions";
import { getPublicSiteSettings } from "@/lib/api/site-settings.functions";
import { absoluteUrl, safeJsonLd, SITE } from "@/lib/seo";

export const Route = createFileRoute("/ministries_/$id")({
  loader: async ({ params }) => {
    const [ministry, siteSettings] = await Promise.all([
      getPublicMinistry({ data: { slug: params.id } }),
      getPublicSiteSettings(),
    ]);
    if (!ministry) throw notFound();
    return { ministry, siteSettings };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { ministry, siteSettings } = loaderData;
    const pageUrl = absoluteUrl(`/ministries/${encodeURIComponent(ministry.slug)}`);
    const imageUrl = absoluteUrl(ministry.image);
    const description = ministry.seoDescription || ministry.summary;
    return {
      meta: [
        { title: ministry.seoTitle || `${ministry.name} — ${siteSettings.shortName}` },
        { name: "description", content: description },
        { property: "og:title", content: ministry.name },
        { property: "og:description", content: description },
        { property: "og:url", content: pageUrl },
        { property: "og:image", content: imageUrl },
        { property: "og:image:alt", content: ministry.imageAlt },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${pageUrl}#ministry`,
            name: ministry.name,
            description: ministry.description,
            url: pageUrl,
            image: imageUrl,
            email: ministry.contactEmail || undefined,
            telephone: ministry.contactPhone || undefined,
            parentOrganization: {
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
      <h1 className="font-display text-3xl">Ministry not found</h1>
      <p className="mt-3 text-muted-foreground">
        This ministry may not be published yet or its address may have changed.
      </p>
      <Button asChild className="mt-6">
        <Link to="/ministries">View all ministries</Link>
      </Button>
    </div>
  ),
  errorComponent: () => (
    <div className="container-page py-32 text-center">
      <h1 className="font-display text-3xl">Ministries are temporarily unavailable</h1>
      <Button asChild className="mt-6">
        <Link to="/ministries">Return to ministries</Link>
      </Button>
    </div>
  ),
  component: MinistryDetailPage,
});

function MinistryDetailPage() {
  const { ministry, siteSettings } = Route.useLoaderData();
  const email = ministry.contactEmail || siteSettings.email;
  const phone = ministry.contactPhone || siteSettings.phone;
  const phoneHref = phone.replace(/[^+\d]/g, "");

  return (
    <article>
      <section className="relative isolate overflow-hidden bg-charcoal text-cream">
        <img
          src={ministry.image}
          alt={ministry.imageAlt}
          className="absolute inset-0 -z-20 size-full object-cover opacity-35"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-charcoal via-charcoal/85 to-charcoal/30" />
        <div className="container-page py-16 md:py-28">
          <Button asChild variant="ghost" size="sm" className="text-cream hover:text-foreground">
            <Link to="/ministries">
              <ArrowLeft className="size-4" /> All ministries
            </Link>
          </Button>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.28em] text-gold">
            Find your place
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl md:text-6xl">{ministry.name}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-cream/85">{ministry.summary}</p>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-burgundy">
              About this ministry
            </p>
            <div className="mt-4 whitespace-pre-line text-lg leading-8 text-muted-foreground">
              {ministry.description}
            </div>

            {ministry.whatToExpect && (
              <section className="mt-12 border-t border-border pt-10">
                <h2 className="font-display text-3xl">What to expect</h2>
                <p className="mt-4 whitespace-pre-line leading-7 text-muted-foreground">
                  {ministry.whatToExpect}
                </p>
              </section>
            )}

            {ministry.joinInstructions && (
              <section className="mt-12 rounded-2xl bg-secondary/60 p-7 md:p-9">
                <h2 className="font-display text-3xl">Ready to get involved?</h2>
                <p className="mt-4 whitespace-pre-line leading-7 text-muted-foreground">
                  {ministry.joinInstructions}
                </p>
                <Button asChild className="mt-6">
                  <a
                    href={`mailto:${email}?subject=${encodeURIComponent(`Interested in ${ministry.name}`)}`}
                  >
                    <Mail className="size-4" /> Contact the ministry
                  </a>
                </Button>
              </section>
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-28">
            <h2 className="font-display text-2xl">Ministry details</h2>
            <dl className="mt-6 space-y-5 text-sm">
              {ministry.audience && (
                <div className="flex gap-3">
                  <Users className="mt-0.5 size-5 shrink-0 text-gold" />
                  <div>
                    <dt className="font-semibold text-foreground">Who it serves</dt>
                    <dd className="mt-1 text-muted-foreground">{ministry.audience}</dd>
                  </div>
                </div>
              )}
              {ministry.meetingSchedule && (
                <div className="flex gap-3">
                  <Clock className="mt-0.5 size-5 shrink-0 text-gold" />
                  <div>
                    <dt className="font-semibold text-foreground">Schedule</dt>
                    <dd className="mt-1 text-muted-foreground">{ministry.meetingSchedule}</dd>
                  </div>
                </div>
              )}
              {ministry.meetingLocation && (
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-gold" />
                  <div>
                    <dt className="font-semibold text-foreground">Location</dt>
                    <dd className="mt-1 text-muted-foreground">{ministry.meetingLocation}</dd>
                  </div>
                </div>
              )}
              {ministry.leaderName && (
                <div className="flex gap-3">
                  <User className="mt-0.5 size-5 shrink-0 text-gold" />
                  <div>
                    <dt className="font-semibold text-foreground">Leader</dt>
                    <dd className="mt-1 text-muted-foreground">
                      {ministry.leaderName}
                      {ministry.leaderTitle && (
                        <span className="block">{ministry.leaderTitle}</span>
                      )}
                    </dd>
                  </div>
                </div>
              )}
            </dl>
            <div className="mt-7 grid gap-3 border-t border-border pt-6">
              <Button asChild>
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent(`Interested in ${ministry.name}`)}`}
                >
                  <Mail className="size-4" /> Email us
                </a>
              </Button>
              {phone && (
                <Button asChild variant="outline">
                  <a href={`tel:${phoneHref}`}>
                    <Phone className="size-4" /> {phone}
                  </a>
                </Button>
              )}
            </div>
          </aside>
        </div>
      </section>
    </article>
  );
}
