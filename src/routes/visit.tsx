import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { ArrowRight, Clock3, Mail, MapPin, Phone, Users } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IMAGES } from "@/data/church";
import { absoluteUrl } from "@/lib/seo";
import { formatSiteAddress } from "@/lib/site-settings/schemas";
import { PageHero } from "./about";

export const Route = createFileRoute("/visit")({
  head: () => ({
    meta: [
      { title: "Plan Your Visit | Anglican Church in Houston, TX" },
      {
        name: "description",
        content:
          "Plan your first visit to Anglican Church of the Epiphany in Houston. Find service times, directions, what to expect, and contact details.",
      },
      { property: "og:title", content: "Plan Your Visit — Epiphany Houston" },
      {
        property: "og:description",
        content: "Service times, directions, and helpful information for your first visit.",
      },
      { property: "og:url", content: absoluteUrl("/visit") },
      { property: "og:image", content: absoluteUrl(IMAGES.churchExterior) },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/visit") }],
  }),
  component: VisitPage,
});

const rootRoute = getRouteApi("__root__");

function VisitPage() {
  const { siteSettings } = rootRoute.useLoaderData();
  const address = formatSiteAddress(siteSettings);
  const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  const content = siteSettings.visit;
  return (
    <>
      <PageHero
        eyebrow={content.heroEyebrow}
        title={content.heroTitle}
        subtitle={content.heroSubtitle}
        image={content.heroImagePath || IMAGES.churchExterior}
      />

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-burgundy">
              {content.introEyebrow}
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl md:text-5xl">
              {content.introTitle}
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {content.introBody}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  Get directions <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">Ask a question</Link>
              </Button>
            </div>
          </div>

          <Card className="border-gold/30 bg-secondary/50">
            <CardContent className="p-7 md:p-8">
              <MapPin className="size-7 text-burgundy" aria-hidden />
              <h2 className="mt-4 font-display text-2xl">Where to find us</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{address}</p>
              <div className="mt-6 space-y-3 text-sm">
                <a
                  className="flex items-center gap-3 hover:text-burgundy"
                  href={`tel:${siteSettings.phone}`}
                >
                  <Phone className="size-4 text-gold" /> {siteSettings.phone}
                </a>
                <a
                  className="flex items-center gap-3 break-all hover:text-burgundy"
                  href={`mailto:${siteSettings.email}`}
                >
                  <Mail className="size-4 shrink-0 text-gold" /> {siteSettings.email}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">When we gather</p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl">Service times</h2>
            <p className="mt-4 opacity-80">
              Check the events page for special services and schedule updates.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {siteSettings.serviceTimes.map((service) => (
              <article
                key={service.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <Clock3 className="size-5 text-gold" aria-hidden />
                <p className="mt-4 text-xs uppercase tracking-[0.22em] text-gold">{service.day}</p>
                <h3 className="mt-2 font-display text-2xl">{service.time}</h3>
                <p className="mt-2 font-semibold">{service.title}</p>
                <p className="mt-2 text-sm leading-relaxed opacity-75">{service.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="hero">
              <Link to="/events">View upcoming events</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <Users className="size-8 text-burgundy" aria-hidden />
            <h2 className="mt-4 font-display text-3xl md:text-4xl">{content.expectationsTitle}</h2>
            <div className="mt-6 space-y-5 text-muted-foreground">
              {content.expectations.map((expectation, index) => (
                <p key={index}>{expectation}</p>
              ))}
              {siteSettings.visitorServiceDuration && (
                <p>Typical service duration: {siteSettings.visitorServiceDuration}</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-3xl md:text-4xl">{content.faqTitle}</h2>
            <Accordion type="single" collapsible className="mt-5">
              {content.faqs.map((item, index) => (
                <AccordionItem key={item.id} value={`visit-${index}`}>
                  <AccordionTrigger className="text-left font-display text-lg">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="container-page pb-8">
        <div className="rounded-3xl bg-secondary px-6 py-10 text-center md:px-12 md:py-14">
          <h2 className="font-display text-3xl md:text-4xl">{content.closingTitle}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{content.closingBody}</p>
          <Button asChild className="mt-6" size="lg">
            <Link to="/contact">Contact the church</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
