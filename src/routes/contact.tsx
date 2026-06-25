import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CHURCH, SERVICE_TIMES, IMAGES } from "@/data/church";
import { submitContact } from "@/lib/forms.functions";
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
  const submit = useServerFn(submitContact);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", subject: "", message: "",
  });

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await submit({ data: form });
      toast.success("Thank you — we'll be in touch soon.");
      setForm({ firstName: "", lastName: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your message");
    } finally {
      setPending(false);
    }
  }

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
            onSubmit={onSubmit}
            className="rounded-3xl border border-border bg-card p-8 md:p-10 space-y-4 h-fit shadow-elegant"
          >
            <h2 className="font-display text-2xl">Send us a message</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input required placeholder="First name" aria-label="First name" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
              <Input required placeholder="Last name" aria-label="Last name" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
            </div>
            <Input required type="email" placeholder="Email" aria-label="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            <Input type="tel" placeholder="Phone" aria-label="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            <Input placeholder="Subject" aria-label="Subject" value={form.subject} onChange={(e) => update("subject", e.target.value)} />
            <Textarea required placeholder="Your message…" rows={6} aria-label="Message" value={form.message} onChange={(e) => update("message", e.target.value)} />
            <Button type="submit" variant="default" size="lg" className="w-full" disabled={pending}>
              {pending ? "Sending…" : "Send message"}
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
