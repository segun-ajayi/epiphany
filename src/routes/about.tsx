import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { IMAGES } from "@/data/church";
import { getPublicLeadership } from "@/lib/api/content.functions";
import { absoluteUrl, safeJsonLd, SITE } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  loader: () => getPublicLeadership(),
  head: ({ loaderData }) => ({
    meta: [
      { title: "About Us — Anglican Church of Epiphany" },
      {
        name: "description",
        content:
          "Our story, mission, beliefs, and leadership team at Anglican Church of Epiphany in Houston, Texas.",
      },
      { property: "og:title", content: "About Anglican Church of Epiphany" },
      { property: "og:description", content: "Our history, beliefs, and leadership." },
      { property: "og:url", content: absoluteUrl("/about") },
      { property: "og:image", content: absoluteUrl(IMAGES.churchExterior) },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/about") }],
    scripts: loaderData?.length
      ? [
          {
            type: "application/ld+json",
            children: safeJsonLd({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "Clergy and staff",
              itemListElement: loaderData.map((leader, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "Person",
                  name: leader.name,
                  jobTitle: leader.role,
                  description: leader.bio || undefined,
                  image: leader.photo ? absoluteUrl(leader.photo) : undefined,
                  sameAs: [leader.facebookUrl, leader.instagramUrl, leader.linkedinUrl].filter(
                    Boolean,
                  ),
                  worksFor: { "@id": `${SITE.origin}/#organization` },
                },
              })),
            }),
          },
        ]
      : undefined,
  }),
  component: AboutPage,
});

const rootRoute = getRouteApi("__root__");

function AboutPage() {
  const leadership = Route.useLoaderData();
  const { siteSettings } = rootRoute.useLoaderData();
  const content = siteSettings.about;
  return (
    <>
      <PageHero
        eyebrow={content.heroEyebrow}
        title={content.heroTitle}
        subtitle={content.heroSubtitle}
        image={content.heroImagePath || IMAGES.churchExterior}
      />

      {/* MISSION & VISION */}
      <section className="container-page py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-10">
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy">Mission</p>
            <h2 className="mt-3 font-display text-3xl">{content.missionTitle}</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">{content.missionBody}</p>
          </Card>
          <Card className="p-10 bg-primary text-primary-foreground">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Vision</p>
            <h2 className="mt-3 font-display text-3xl">{content.visionTitle}</h2>
            <p className="mt-4 opacity-90 leading-relaxed">{content.visionBody}</p>
          </Card>
        </div>
      </section>

      {/* HISTORY TIMELINE */}
      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy">Our Story</p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl">{content.historyTitle}</h2>
          </div>
          <ol className="mt-16 relative max-w-3xl mx-auto">
            <span
              className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border"
              aria-hidden
            />
            {content.history.map((h, i) => (
              <li
                key={h.id}
                className={`relative grid md:grid-cols-2 gap-6 mb-12 md:mb-16 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
              >
                <div className="pl-12 md:pl-0 md:pr-10 md:text-right">
                  <p className="font-display text-4xl text-gold">{h.year}</p>
                  <p className="mt-1 font-display text-xl">{h.title}</p>
                </div>
                <div className="pl-12 md:pl-10">
                  <p className="text-muted-foreground leading-relaxed">{h.body}</p>
                </div>
                <span
                  className="absolute left-2.5 md:left-1/2 top-2 -translate-x-1/2 size-3 rounded-full bg-gold ring-4 ring-background"
                  aria-hidden
                />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* BELIEFS */}
      <section className="container-page py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy">What We Believe</p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl">{content.beliefsTitle}</h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">{content.beliefsIntro}</p>
          </div>
          <Accordion type="single" collapsible defaultValue="b0" className="w-full">
            {content.beliefs.map((b, i) => (
              <AccordionItem key={b.id} value={`b${i}`}>
                <AccordionTrigger className="font-display text-lg text-left">
                  {b.title}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {b.body}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {leadership.length > 0 && (
        <section className="bg-secondary/50 py-20 md:py-28">
          <div className="container-page">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs uppercase tracking-[0.28em] text-burgundy">Our Leaders</p>
              <h2 className="mt-3 font-display text-3xl md:text-5xl">Clergy & staff</h2>
            </div>
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {leadership.map((l) => (
                <Card key={l.id} className="overflow-hidden text-center">
                  <div className="grid aspect-square place-items-center bg-gradient-to-br from-[#1E3A5F] to-[#a22492ff]">
                    {l.photo ? (
                      <img
                        src={l.photo}
                        alt={l.photoAlt}
                        width={640}
                        height={794}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover object-top rounded-md"
                      />
                    ) : (
                      <span className="font-display text-5xl text-gold">
                        {l.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-display text-lg">{l.name}</h3>
                    <p className="text-xs uppercase tracking-widest text-burgundy">{l.role}</p>
                    {l.bio && <p className="mt-3 text-sm text-muted-foreground">{l.bio}</p>}
                    <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-primary">
                      {l.email && (
                        <a
                          href={`mailto:${l.email}`}
                          className="inline-flex items-center gap-2 hover:text-gold"
                        >
                          <Mail className="size-4" /> Email
                        </a>
                      )}
                      {l.phone && (
                        <a
                          href={`tel:${l.phone}`}
                          className="inline-flex items-center gap-2 hover:text-gold"
                        >
                          <Phone className="size-4" /> Call
                        </a>
                      )}
                    </div>
                    <div className="mt-4 flex justify-center gap-4 text-primary">
                      {l.facebookUrl && (
                        <a
                          href={l.facebookUrl}
                          aria-label={`${l.name} on Facebook`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Facebook className="size-4 hover:text-gold transition" />
                        </a>
                      )}
                      {l.instagramUrl && (
                        <a
                          href={l.instagramUrl}
                          aria-label={`${l.name} on Instagram`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Instagram className="size-4 hover:text-gold transition" />
                        </a>
                      )}
                      {l.linkedinUrl && (
                        <a
                          href={l.linkedinUrl}
                          aria-label={`${l.name} on LinkedIn`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Linkedin className="size-4 hover:text-gold transition" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="container-page py-20 md:py-28">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy">FAQ</p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl">
              {siteSettings.visit.faqTitle}
            </h2>
          </div>
          <Accordion type="single" collapsible className="mt-10">
            {siteSettings.visit.faqs.map((f, i) => (
              <AccordionItem key={f.id} value={`f${i}`}>
                <AccordionTrigger className="font-display text-lg text-left">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  image: string;
}) {
  return (
    <section className="relative -mt-16 md:-mt-20 min-h-[60vh] flex items-end overflow-hidden">
      <img
        src={image}
        alt=""
        width={1280}
        height={960}
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/70 to-[#0F172A]/40"
        aria-hidden
      />
      <div className="container-page relative z-10 pt-32 pb-16 text-primary-foreground">
        <p className="text-xs uppercase tracking-[0.32em] text-gold">{eyebrow}</p>
        <h1 className="mt-4 font-display text-4xl md:text-6xl max-w-3xl text-balance">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl opacity-90">{subtitle}</p>}
      </div>
    </section>
  );
}
