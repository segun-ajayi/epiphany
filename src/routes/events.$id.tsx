import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Calendar, MapPin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EVENTS, CHURCH } from "@/data/church";

export const Route = createFileRoute("/events/$id")({
  loader: ({ params }) => {
    const event = EVENTS.find((e) => e.id === params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.event.title} — Events` },
          { name: "description", content: loaderData.event.description },
          { property: "og:title", content: loaderData.event.title },
          { property: "og:image", content: loaderData.event.image },
          { property: "og:type", content: "article" },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="container-page py-32 text-center">
      <h1 className="font-display text-3xl">Event not found</h1>
      <Button asChild className="mt-6"><Link to="/events">Back to events</Link></Button>
    </div>
  ),
  errorComponent: () => (
    <div className="container-page py-32 text-center">
      <h1 className="font-display text-3xl">Something went wrong</h1>
      <Button asChild className="mt-6"><Link to="/events">Back to events</Link></Button>
    </div>
  ),
  component: EventDetail,
});

function EventDetail() {
  const { event } = Route.useLoaderData();
  return (
    <article className="container-page py-12 md:py-20">
      <Button asChild variant="ghost" size="sm"><Link to="/events"><ArrowLeft className="size-4" /> All events</Link></Button>
      <div className="mt-8 grid lg:grid-cols-[2fr_1fr] gap-10">
        <div>
          <div className="aspect-[16/9] rounded-2xl overflow-hidden">
            <img src={event.image} alt={event.title} className="size-full object-cover" />
          </div>
          <p className="mt-6 text-xs uppercase tracking-widest text-burgundy font-semibold">{event.category}</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">{event.title}</h1>
          <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><Calendar className="size-4 text-gold" /> {new Date(event.date).toLocaleDateString("en-US",{ weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {event.time}</p>
            <p className="flex items-center gap-2"><MapPin className="size-4 text-gold" /> {event.location}</p>
          </div>
          <p className="mt-6 text-lg leading-relaxed">{event.description}</p>
          <div className="mt-6 aspect-[16/9] rounded-2xl bg-secondary grid place-items-center text-muted-foreground border border-border">
            <div className="text-center">
              <MapPin className="size-8 mx-auto text-gold" />
              <p className="mt-2 text-sm">{CHURCH.address}</p>
              <p className="text-xs">Map placeholder</p>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => navigator.share?.({ title: event.title, url: window.location.href }).catch(() => {})}>
              <Share2 className="size-4" /> Share
            </Button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 h-fit">
          <form
            onSubmit={(e) => { e.preventDefault(); alert("Registration received — see you there!"); }}
            className="rounded-2xl border border-border p-6 bg-card space-y-3"
          >
            <h2 className="font-display text-xl">Register to attend</h2>
            <Input required placeholder="Full name" aria-label="Name" />
            <Input required type="email" placeholder="Email" aria-label="Email" />
            <Input type="tel" placeholder="Phone" aria-label="Phone" />
            <Input type="number" min={1} defaultValue={1} placeholder="Number of attendees" aria-label="Number of attendees" />
            <Button type="submit" className="w-full" variant="default">Register</Button>
          </form>
        </aside>
      </div>
    </article>
  );
}
