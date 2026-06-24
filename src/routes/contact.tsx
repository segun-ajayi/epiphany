import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CHURCH, SERVICE_TIMES, IMAGES } from "@/data/church";
import { PageHero } from "./about";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Anglican Church of Epiphany" },
      { name: "description", content: "Get in touch with Anglican Church of Epiphany in Houston, Texas. Visit, call, or send a message." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="We'd love to hear from you" subtitle="Plan your visit, ask a question, or share a prayer request." image={IMAGES.churchExterior} />

      <section className="container-page py-16">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <Card className="p-6 flex gap-4 items-start">
              <span className="size-12 grid place-items-center rounded-full bg-primary text-primary-foreground"><MapPin className="size-5" /></span>
              <div>
                <p className="font-display text-lg">Visit us</p>
                <p className="text-muted-foreground">{CHURCH.address}</p>
              </div>
            </Card>
            <Card className="p-6 flex gap-4 items-start">
              <span className="size-12 grid place-items-center rounded-full bg-primary text-primary-foreground"><Phone className="size-5" /></span>
              <div>
                <p className="font-display text-lg">Call</p>
                <a className="text-muted-foreground hover:text-gold" href={`tel:${CHURCH.phone}`}>{CHURCH.phone}</a>
              </div>
            </Card>
            <Card className="p-6 flex gap-4 items-start">
              <span className="size-12 grid place-items-center rounded-full bg-primary text-primary-foreground"><Mail className="size-5" /></span>
              <div>
                <p className="font-display text-lg">Email</p>
                <a className="text-muted-foreground hover:text-gold" href={`mailto:${CHURCH.email}`}>{CHURCH.email}</a>
              </div>
            </Card>
            <Card className="p-6 flex gap-4 items-start">
              <span className="size-12 grid place-items-center rounded-full bg-primary text-primary-foreground"><Clock className="size-5" /></span>
              <div>
                <p className="font-display text-lg">Service times</p>
                <ul className="text-muted-foreground text-sm space-y-1 mt-1">
                  {SERVICE_TIMES.map((s) => <li key={s.title}>{s.day} {s.time} · {s.title}</li>)}
                </ul>
              </div>
            </Card>

            <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-border">
              <iframe
                title="Map"
                width="100%"
                height="100%"
                loading="lazy"
                src={`https://www.google.com/maps?q=${encodeURIComponent(CHURCH.address)}&output=embed`}
              />
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); alert("Thank you — we'll be in touch soon."); }}
            className="rounded-3xl border border-border bg-card p-8 md:p-10 space-y-4 h-fit shadow-elegant"
          >
            <h2 className="font-display text-2xl">Send us a message</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input required placeholder="First name" aria-label="First name" />
              <Input required placeholder="Last name" aria-label="Last name" />
            </div>
            <Input required type="email" placeholder="Email" aria-label="Email" />
            <Input type="tel" placeholder="Phone" aria-label="Phone" />
            <Input placeholder="Subject" aria-label="Subject" />
            <Textarea required placeholder="Your message…" rows={6} aria-label="Message" />
            <Button type="submit" variant="default" size="lg" className="w-full">Send message</Button>
          </form>
        </div>
      </section>
    </>
  );
}
