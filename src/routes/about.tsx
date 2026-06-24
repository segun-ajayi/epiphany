import { createFileRoute } from "@tanstack/react-router";
import { Facebook, Linkedin, Mail, Twitter } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { BELIEFS, HISTORY, LEADERSHIP, FAQ_VISIT, IMAGES } from "@/data/church";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Anglican Church of Epiphany" },
      {
        name: "description",
        content:
          "Our story, mission, beliefs, and leadership team at Anglican Church of Epiphany in Houston, Texas.",
      },
      { property: "og:title", content: "About Anglican Church of Epiphany" },
      { property: "og:description", content: "Our history, beliefs, and leadership." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="A community shaped by ancient faith"
        subtitle="Since 1962, Anglican Church of Epiphany has been a worshipping family in the heart of Houston."
        image={IMAGES.churchExterior}
      />

      {/* MISSION & VISION */}
      <section className="container-page py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-10">
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy">Mission</p>
            <h2 className="mt-3 font-display text-3xl">To know Christ and make him known.</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              We gather to worship Jesus, grow as his disciples, and carry his love into every
              corner of Houston.
            </p>
          </Card>
          <Card className="p-10 bg-primary text-primary-foreground">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Vision</p>
            <h2 className="mt-3 font-display text-3xl">
              A parish family formed by scripture, sacrament, and love.
            </h2>
            <p className="mt-4 opacity-90 leading-relaxed">
              A multi-generational community where ancient worship meets present-day mission.
            </p>
          </Card>
        </div>
      </section>

      {/* HISTORY TIMELINE */}
      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy">Our Story</p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl">A heritage of faithfulness</h2>
          </div>
          <ol className="mt-16 relative max-w-3xl mx-auto">
            <span
              className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border"
              aria-hidden
            />
            {HISTORY.map((h, i) => (
              <li
                key={h.year}
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
            <h2 className="mt-3 font-display text-3xl md:text-5xl">
              Rooted in scripture, formed by tradition
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              We stand within the great stream of historic, orthodox Christianity, worshipping
              according to the Book of Common Prayer.
            </p>
          </div>
          <Accordion type="single" collapsible defaultValue="b0" className="w-full">
            {BELIEFS.map((b, i) => (
              <AccordionItem key={b.title} value={`b${i}`}>
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

      {/* LEADERSHIP */}
      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy">Our Leaders</p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl">Clergy & staff</h2>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {LEADERSHIP.map((l) => (
              <Card key={l.email} className="overflow-hidden text-center">
                <div className="aspect-square bg-gradient-to-br from-[#1E3A5F] to-[#a22492ff]">
                  {l.photo ? (
                    <img
                      src={l.photo}
                      alt={l.name}
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
                  <p className="mt-3 text-sm text-muted-foreground">{l.bio}</p>
                  <a
                    href={`mailto:${l.email}`}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:text-gold transition"
                  >
                    <Mail className="size-4" /> Contact
                  </a>
                  <div className="mt-4 flex justify-center gap-4 text-primary">
                    {l.socials?.facebook && (
                      <a href={l.socials.facebook} target="_blank" rel="noopener noreferrer">
                        <Facebook className="size-4 hover:text-gold transition" />
                      </a>
                    )}
                    {l.socials?.twitter && (
                      <a href={l.socials.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter className="size-4 hover:text-gold transition" />
                      </a>
                    )}
                    {l.socials?.linkedin && (
                      <a href={l.socials.linkedin} target="_blank" rel="noopener noreferrer">
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

      {/* FAQ */}
      <section className="container-page py-20 md:py-28">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy">FAQ</p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl">For first-time visitors</h2>
          </div>
          <Accordion type="single" collapsible className="mt-10">
            {FAQ_VISIT.map((f, i) => (
              <AccordionItem key={f.q} value={`f${i}`}>
                <AccordionTrigger className="font-display text-lg text-left">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
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
      <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
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
