import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/data/church";
import { formatSiteAddress } from "@/lib/site-settings/schemas";
import { PageHero } from "./about";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Anglican Church of Epiphany" },
      {
        name: "description",
        content:
          "Get in touch with Anglican Church of Epiphany in Houston, Texas. Visit, call, or send a message.",
      },
      { property: "og:url", content: absoluteUrl("/contact") },
      { property: "og:image", content: absoluteUrl(IMAGES.churchExterior) },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/contact") }],
  }),
  component: ContactPage,
});

const rootRoute = getRouteApi("__root__");

function ContactPage() {
  const { siteSettings } = rootRoute.useLoaderData();
  const hero = siteSettings.pages.contact;
  const address = formatSiteAddress(siteSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startedAt = useRef(Date.now());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      topic: formData.get("topic"),
      subject: formData.get("subject"),
      message: formData.get("message"),
      consent: formData.get("consent") === "yes",
      website: formData.get("website"),
      startedAt: startedAt.current,
    };

    try {
      // Replace '/api/contact' with your actual endpoint or submission URL
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Contact-Request": "1" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Message sent successfully!", {
          description: "Thank you — we'll be in touch soon.",
        });
        e.currentTarget.reset(); // Resets the form fields clean
        startedAt.current = Date.now();
      } else {
        const body = await response.json().catch(() => null);
        toast.error("Something went wrong", {
          description: body?.error || "Please check your details and try again.",
        });
      }
    } catch (error) {
      toast.error("Connection failed", {
        description: "Could not reach the server. Check your internet connection.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }; // Added missing closing brace here

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        subtitle={hero.subtitle}
        image={hero.imagePath || IMAGES.churchExterior}
      />

      <section className="container-page py-16">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <Card className="p-6 flex gap-4 items-start">
              <span className="size-12 grid place-items-center rounded-full bg-primary text-primary-foreground">
                <MapPin className="size-5" />
              </span>
              <div>
                <p className="font-display text-lg">Visit us</p>
                <p className="text-muted-foreground">{address}</p>
              </div>
            </Card>
            <Card className="p-6 flex gap-4 items-start">
              <span className="size-12 grid place-items-center rounded-full bg-primary text-primary-foreground">
                <Phone className="size-5" />
              </span>
              <div>
                <p className="font-display text-lg">Call</p>
                <a
                  className="text-muted-foreground hover:text-gold"
                  href={`tel:${siteSettings.phone}`}
                >
                  {siteSettings.phone}
                </a>
              </div>
            </Card>
            <Card className="p-6 flex gap-4 items-start">
              <span className="size-12 grid place-items-center rounded-full bg-primary text-primary-foreground">
                <Mail className="size-5" />
              </span>
              <div>
                <p className="font-display text-lg">Email</p>
                <a
                  className="text-muted-foreground hover:text-gold"
                  href={`mailto:${siteSettings.email}`}
                >
                  {siteSettings.email}
                </a>
              </div>
            </Card>
            <Card className="p-6 flex gap-4 items-start">
              <span className="size-12 grid place-items-center rounded-full bg-primary text-primary-foreground">
                <Clock className="size-5" />
              </span>
              <div>
                <p className="font-display text-lg">Service times</p>
                <ul className="text-muted-foreground text-sm space-y-1 mt-1">
                  {siteSettings.serviceTimes.map((s) => (
                    <li key={s.title}>
                      {s.day} {s.time} · {s.title}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-border">
              <iframe
                title="Map"
                width="100%"
                height="100%"
                loading="lazy"
                src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
              />
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-border bg-card p-8 md:p-10 space-y-4 h-fit shadow-elegant"
          >
            <h2 className="font-display text-2xl">Send us a message</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input required name="firstName" placeholder="First name" aria-label="First name" />
              <Input required name="lastName" placeholder="Last name" aria-label="Last name" />
            </div>
            <Input required name="email" type="email" placeholder="Email" aria-label="Email" />
            <Input name="phone" type="tel" placeholder="Phone" aria-label="Phone" />
            <label className="grid gap-2 text-sm font-medium">
              How can we help?
              <select
                name="topic"
                defaultValue="general"
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="general">General question</option>
                <option value="visit">Planning a visit</option>
                <option value="ministry">Ministry information</option>
                <option value="prayer">Prayer request</option>
                <option value="pastoral">Pastoral care</option>
              </select>
            </label>
            <Input name="subject" placeholder="Subject" aria-label="Subject" />
            <Textarea
              required
              name="message"
              placeholder="Your message…"
              rows={6}
              aria-label="Message"
            />
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input required type="checkbox" name="consent" value="yes" className="mt-1" />
              <span>
                I consent to the church storing these details to respond to my message. Prayer and
                pastoral requests are visible only to authorized administrators.
              </span>
            </label>
            <label className="absolute -left-[10000px]" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send message"}
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
