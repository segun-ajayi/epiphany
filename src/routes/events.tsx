import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EVENTS, IMAGES } from "@/data/church";
import { PageHero } from "./about";

const CATEGORIES = ["All", "Worship", "Fellowship", "Outreach", "Youth", "Bible Study"] as const;

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — Anglican Church of Epiphany" },
      { name: "description", content: "Upcoming events at Anglican Church of Epiphany in Houston, Texas." },
      { property: "og:url", content: "/events" },
    ],
    links: [{ rel: "canonical", href: "/events" }],
  }),
  component: EventsPage,
});

function EventsPage() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const filtered = cat === "All" ? EVENTS : EVENTS.filter((e) => e.category === cat);

  // Calendar — current month, mark dates with events
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const eventDates = new Set(EVENTS.map((e) => new Date(e.date).toDateString()));

  return (
    <>
      <PageHero
        eyebrow="Events"
        title="Gather, grow, and serve"
        subtitle="Find a moment to belong — from Sunday worship to community outreach."
        image={IMAGES.congregation}
      />

      <section className="container-page py-20">
        <div className="grid lg:grid-cols-[2fr_1fr] gap-10">
          <div>
            <div className="flex flex-wrap gap-2 mb-8">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`px-4 py-2 text-sm rounded-full border transition ${
                    cat === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {filtered.map((e) => (
                <Link key={e.id} to="/events/$id" params={{ id: e.id }} className="group">
                  <Card className="overflow-hidden h-full hover:shadow-elegant transition-all">
                    <div className="aspect-[16/10] overflow-hidden">
                      <img src={e.image} alt={e.title} loading="lazy" className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <CardContent className="p-6">
                      <p className="text-xs uppercase tracking-widest text-burgundy font-semibold">{e.category}</p>
                      <h3 className="mt-2 font-display text-xl">{e.title}</h3>
                      <div className="mt-3 text-sm text-muted-foreground space-y-1">
                        <p className="flex items-center gap-2"><Calendar className="size-4 text-gold" /> {new Date(e.date).toLocaleDateString("en-US",{ month: "long", day: "numeric" })} · {e.time}</p>
                        <p className="flex items-center gap-2"><MapPin className="size-4 text-gold" /> {e.location}</p>
                      </div>
                      <p className="mt-3 text-sm inline-flex items-center gap-2 text-primary group-hover:text-gold">Details <ArrowRight className="size-4" /></p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 h-fit">
            <div className="rounded-2xl border border-border p-6 bg-card">
              <p className="font-display text-xl">
                {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
                {["S","M","T","W","T","F","S"].map((d, i) => (
                  <div key={i} className="text-muted-foreground font-medium py-1">{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`b${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const has = eventDates.has(new Date(year, month, day).toDateString());
                  const isToday = day === now.getDate();
                  return (
                    <div key={day} className={`aspect-square grid place-items-center rounded-md text-sm ${
                      isToday ? "bg-primary text-primary-foreground" : has ? "bg-gold/20 text-foreground font-semibold" : "text-muted-foreground"
                    }`}>
                      {day}
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-muted-foreground"><span className="inline-block size-2 rounded-full bg-gold align-middle mr-2" />Days with events</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
