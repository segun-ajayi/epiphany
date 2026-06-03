import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Clock, User, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MINISTRIES, IMAGES, type Ministry } from "@/data/church";
import { PageHero } from "./about";

export const Route = createFileRoute("/ministries")({
  head: () => ({
    meta: [
      { title: "Ministries — Anglican Church of Epiphany" },
      { name: "description", content: "Find your place at Epiphany: children's, youth, men's, women's, prayer, choir, outreach, and Bible study ministries." },
      { property: "og:url", content: "/ministries" },
    ],
    links: [{ rel: "canonical", href: "/ministries" }],
  }),
  component: MinistriesPage,
});

function MinistriesPage() {
  const [selected, setSelected] = useState<Ministry | null>(null);
  return (
    <>
      <PageHero
        eyebrow="Ministries"
        title="There's a place for you to belong"
        subtitle="From the youngest to the eldest, we have ministries that gather, form, and send."
        image={IMAGES.congregation}
      />
      <section className="container-page py-20 md:py-28">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MINISTRIES.map((m) => (
            <Card key={m.id} className="overflow-hidden flex flex-col h-full hover:shadow-elegant transition-all">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={m.image} alt={m.name} loading="lazy" className="size-full object-cover" />
              </div>
              <CardContent className="p-6 flex-1 flex flex-col">
                <h3 className="font-display text-xl">{m.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{m.description}</p>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Clock className="size-4 text-gold" /> {m.meetingTime}</p>
                  <p className="flex items-center gap-2"><User className="size-4 text-gold" /> {m.leader}</p>
                </div>
                <div className="mt-6 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelected(m)}>Learn more</Button>
                  <Button asChild size="sm" variant="default"><a href={`mailto:${m.email}`}><Mail className="size-4" /> Contact</a></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur p-4" onClick={() => setSelected(null)} role="dialog" aria-modal>
          <div className="bg-card rounded-2xl max-w-2xl w-full overflow-hidden shadow-elegant" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-video">
              <img src={selected.image} alt={selected.name} className="size-full object-cover" />
              <button aria-label="Close" onClick={() => setSelected(null)} className="absolute top-3 right-3 size-9 grid place-items-center rounded-full bg-background/80 hover:bg-background">
                <X className="size-4" />
              </button>
            </div>
            <div className="p-8">
              <h3 className="font-display text-2xl">{selected.name}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{selected.longDescription}</p>
              <div className="mt-5 text-sm text-muted-foreground space-y-1">
                <p><span className="text-foreground font-medium">Meeting time:</span> {selected.meetingTime}</p>
                <p><span className="text-foreground font-medium">Leader:</span> {selected.leader}</p>
              </div>
              <Button asChild className="mt-6" variant="default"><a href={`mailto:${selected.email}`}><Mail className="size-4" /> Get in touch</a></Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
