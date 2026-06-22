import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Play, Headphones, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SERMONS } from "@/data/church";

export const Route = createFileRoute("/sermons_/$id")({
  loader: ({ params }) => {
    const sermon = SERMONS.find((s) => s.id === params.id);
    if (!sermon) throw notFound();
    return { sermon };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.sermon.title} — Sermons` },
          { name: "description", content: loaderData.sermon.description },
          { property: "og:title", content: loaderData.sermon.title },
          { property: "og:description", content: loaderData.sermon.description },
          { property: "og:image", content: loaderData.sermon.thumbnail },
          { property: "og:type", content: "article" },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="container-page py-32 text-center">
      <h1 className="font-display text-3xl">Sermon not found</h1>
      <Button asChild className="mt-6"><Link to="/sermons">Back to sermons</Link></Button>
    </div>
  ),
  errorComponent: () => (
    <div className="container-page py-32 text-center">
      <h1 className="font-display text-3xl">Something went wrong</h1>
      <Button asChild className="mt-6"><Link to="/sermons">Back to sermons</Link></Button>
    </div>
  ),
  component: SermonDetail,
});

function SermonDetail() {
  const { sermon } = Route.useLoaderData();
  return (
    <article className="container-page py-12 md:py-20">
      <Button asChild variant="ghost" size="sm"><Link to="/sermons"><ArrowLeft className="size-4" /> All sermons</Link></Button>
      <div className="mt-8 grid lg:grid-cols-[2fr_1fr] gap-10">
        <div>
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-primary">
            <img src={sermon.thumbnail} alt={sermon.title} className="size-full object-cover" />
            <div className="absolute inset-0 grid place-items-center bg-black/40">
              <span className="size-20 rounded-full bg-gold text-gold-foreground grid place-items-center shadow-glow">
                <Play className="size-8 ml-1" />
              </span>
            </div>
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.22em] text-burgundy font-semibold">{sermon.series} · {sermon.topic}</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">{sermon.title}</h1>
          <p className="mt-3 text-muted-foreground">{sermon.speaker} · {new Date(sermon.date).toLocaleDateString("en-US",{ month: "long", day: "numeric", year: "numeric" })}</p>
          <p className="mt-2 text-muted-foreground italic">{sermon.scripture}</p>
          <p className="mt-6 text-lg leading-relaxed">{sermon.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="default"><Play className="size-4" /> Watch</Button>
            <Button variant="outline"><Headphones className="size-4" /> Listen</Button>
            <Button variant="outline"><FileText className="size-4" /> Download notes</Button>
          </div>
        </div>
        <aside className="lg:sticky lg:top-28 h-fit">
          <div className="rounded-2xl border border-border p-6 bg-card">
            <h2 className="font-display text-xl">More in this series</h2>
            <ul className="mt-4 space-y-3">
              {SERMONS.filter((s) => s.series === sermon.series && s.id !== sermon.id).slice(0, 4).map((s) => (
                <li key={s.id}>
                  <Link to="/sermons/$id" params={{ id: s.id }} className="block text-sm hover:text-gold">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.speaker}</p>
                  </Link>
                </li>
              ))}
              {SERMONS.filter((s) => s.series === sermon.series && s.id !== sermon.id).length === 0 && (
                <li className="text-sm text-muted-foreground">No other sermons in this series yet.</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </article>
  );
}
