import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Play, Headphones, FileText, Search, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SERMONS, IMAGES } from "@/data/church";
import { PageHero } from "./about";

export const Route = createFileRoute("/sermons")({
  head: () => ({
    meta: [
      { title: "Sermons — Anglican Church of Epiphany" },
      { name: "description", content: "Watch, listen to, and read sermons from Anglican Church of Epiphany in Houston, Texas." },
      { property: "og:url", content: "/sermons" },
    ],
    links: [{ rel: "canonical", href: "/sermons" }],
  }),
  component: SermonsPage,
});

function SermonsPage() {
  const [q, setQ] = useState("");
  const [speaker, setSpeaker] = useState("All");
  const [series, setSeries] = useState("All");

  const speakers = useMemo(() => ["All", ...Array.from(new Set(SERMONS.map((s) => s.speaker)))], []);
  const allSeries = useMemo(() => ["All", ...Array.from(new Set(SERMONS.map((s) => s.series)))], []);

  const filtered = SERMONS.filter((s) => {
    const matchesQ = !q || [s.title, s.speaker, s.topic, s.scripture].join(" ").toLowerCase().includes(q.toLowerCase());
    return matchesQ && (speaker === "All" || s.speaker === speaker) && (series === "All" || s.series === series);
  });

  const featured = SERMONS[0];

  return (
    <>
      <PageHero
        eyebrow="Sermons"
        title="Faithful teaching from the Word"
        subtitle="Browse our sermon library by speaker, series, or topic."
        image={IMAGES.bible}
      />

      {/* FEATURED */}
      <section className="container-page py-20">
        <Card className="overflow-hidden grid md:grid-cols-2 bg-primary text-primary-foreground border-0">
          <div className="relative aspect-video md:aspect-auto">
            <img src={featured.thumbnail} alt={featured.title} className="size-full object-cover" />
            <div className="absolute inset-0 grid place-items-center bg-black/30">
              <span className="size-16 rounded-full bg-gold text-gold-foreground grid place-items-center shadow-glow">
                <Play className="size-6 ml-0.5" />
              </span>
            </div>
          </div>
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Latest Sermon</p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">{featured.title}</h2>
            <p className="mt-3 opacity-80">{featured.speaker} · {featured.scripture}</p>
            <p className="mt-4 opacity-90 leading-relaxed">{featured.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="hero"><Play className="size-4" /> Watch</Button>
              <Button variant="ghostLight"><Headphones className="size-4" /> Listen</Button>
              <Button variant="ghostLight"><FileText className="size-4" /> Notes</Button>
            </div>
          </div>
        </Card>
      </section>

      {/* SEARCH + FILTERS */}
      <section className="container-page">
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, speaker, or scripture…" className="pl-10" />
          </div>
          <select value={speaker} onChange={(e) => setSpeaker(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            {speakers.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={series} onChange={(e) => setSeries(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            {allSeries.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* GRID */}
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filtered.map((s) => (
            <Link key={s.id} to="/sermons/$id" params={{ id: s.id }} className="group">
              <Card className="overflow-hidden h-full">
                <div className="relative aspect-video overflow-hidden">
                  <img src={s.thumbnail} alt={s.title} loading="lazy" className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <span className="absolute top-3 left-3 text-[10px] uppercase tracking-widest bg-gold text-gold-foreground px-2 py-1 rounded">{s.series}</span>
                </div>
                <CardContent className="p-6">
                  <p className="text-xs text-muted-foreground flex items-center gap-2"><Calendar className="size-3" /> {new Date(s.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>
                  <h3 className="mt-2 font-display text-xl">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.speaker} · {s.scripture}</p>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-12">No sermons match your filters.</p>
          )}
        </div>
      </section>
    </>
  );
}
