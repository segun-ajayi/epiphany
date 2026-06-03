import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, MapPin, Play, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CHURCH, IMAGES, SERVICE_TIMES, MINISTRIES, EVENTS, SERMONS, TESTIMONIALS,
} from "@/data/church";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Anglican Church of Epiphany — Houston, TX" },
      { name: "description", content: "Anglican Church of Epiphany in Houston, Texas. Plan your visit, watch sermons, and join a community growing in faith and worship." },
      { property: "og:title", content: "Anglican Church of Epiphany — Houston, TX" },
      { property: "og:description", content: "Growing in faith, worship, and community in Houston, Texas." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative -mt-16 md:-mt-20 min-h-[88vh] flex items-end overflow-hidden">
        <img
          src={IMAGES.heroChurch}
          alt="Sanctuary interior of Anglican Church of Epiphany"
          width={1920}
          height={1280}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/70 to-[#0F172A]/30" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(212,175,55,0.25),transparent_55%)]" aria-hidden />

        <div className="container-page relative z-10 pb-20 pt-32 md:pb-28 md:pt-40 text-primary-foreground">
          <p className="inline-flex items-center gap-2 text-xs md:text-sm uppercase tracking-[0.32em] text-gold">
            <Sparkles className="size-4" /> An Anglican Parish in Houston
          </p>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl md:text-7xl leading-[1.05] text-balance max-w-4xl">
            Welcome to <span className="text-gold">Anglican Church of Epiphany</span>
          </h1>
          <p className="mt-6 text-base md:text-xl max-w-2xl opacity-90">
            {CHURCH.tagline}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="hero">
              <Link to="/contact">Plan Your Visit <ArrowRight className="size-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="ghostLight">
              <Link to="/sermons"><Play className="size-4" /> Watch Sermons</Link>
            </Button>
            <Button asChild size="lg" variant="ghostLight">
              <Link to="/give"><Heart className="size-4" /> Give Online</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* WELCOME */}
      <section className="container-page py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy font-semibold">A Word from our Rector</p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl text-balance">
              You are welcome here — exactly as you are.
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Whether you are exploring faith for the first time, returning after years away, or seeking a parish to call home, we are so glad you found us. At Epiphany, we worship the risen Christ through ancient liturgy, faithful teaching, and a warm community of friends.
            </p>
            <div className="mt-8 grid sm:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="font-display text-lg text-foreground">Our Mission</p>
                <p className="mt-1 text-muted-foreground">To know Christ and make him known across Houston.</p>
              </div>
              <div>
                <p className="font-display text-lg text-foreground">Our Vision</p>
                <p className="mt-1 text-muted-foreground">A parish family formed by scripture, sacrament, and love.</p>
              </div>
              <div>
                <p className="font-display text-lg text-foreground">Our Heritage</p>
                <p className="mt-1 text-muted-foreground">60+ years of Anglican worship in the heart of Houston.</p>
              </div>
            </div>
            <Button asChild className="mt-8" variant="outline">
              <Link to="/about">Learn our story <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-gold/20 to-burgundy/10 rounded-3xl blur-2xl" aria-hidden />
            <img
              src={IMAGES.churchExterior}
              alt="Exterior of the church"
              loading="lazy"
              width={1280}
              height={960}
              className="relative rounded-2xl shadow-elegant w-full aspect-[4/3] object-cover"
            />
          </div>
        </div>
      </section>

      {/* SERVICE TIMES */}
      <section className="bg-primary text-primary-foreground py-20 md:py-28">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Join Us</p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl">Service Times</h2>
            <p className="mt-4 opacity-80">We gather each week to worship. There's a place for you.</p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {SERVICE_TIMES.map((s) => (
              <div key={s.title} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-7 hover:bg-white/10 transition">
                <p className="text-gold text-xs uppercase tracking-[0.22em]">{s.day}</p>
                <p className="mt-2 font-display text-3xl">{s.time}</p>
                <p className="mt-3 text-lg">{s.title}</p>
                <p className="mt-2 text-sm opacity-75">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="hero" size="lg">
              <a href={`https://maps.google.com/?q=${encodeURIComponent(CHURCH.address)}`} target="_blank" rel="noreferrer">
                <MapPin className="size-4" /> Get Directions
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* MINISTRIES */}
      <section className="container-page py-20 md:py-28">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy">Get Involved</p>
            <h2 className="mt-2 font-display text-3xl md:text-5xl">Ministries at Epiphany</h2>
          </div>
          <Button asChild variant="link"><Link to="/ministries">View all ministries <ArrowRight className="size-4" /></Link></Button>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MINISTRIES.slice(0, 6).map((m) => (
            <Link key={m.id} to="/ministries" className="group">
              <Card className="overflow-hidden h-full transition-all hover:shadow-elegant hover:-translate-y-1">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={m.image} alt={m.name} loading="lazy" className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-display text-xl">{m.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{m.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* EVENTS */}
      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container-page">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-burgundy">What's Happening</p>
              <h2 className="mt-2 font-display text-3xl md:text-5xl">Upcoming Events</h2>
            </div>
            <Button asChild variant="link"><Link to="/events">All events <ArrowRight className="size-4" /></Link></Button>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {EVENTS.slice(0, 3).map((e) => (
              <Card key={e.id} className="overflow-hidden group">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={e.image} alt={e.title} loading="lazy" className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <CardContent className="p-6">
                  <p className="text-xs uppercase tracking-widest text-burgundy font-semibold">{e.category}</p>
                  <h3 className="mt-2 font-display text-xl">{e.title}</h3>
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="size-4" />
                    {new Date(e.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {e.time}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SERMONS */}
      <section className="container-page py-20 md:py-28">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy">From the Pulpit</p>
            <h2 className="mt-2 font-display text-3xl md:text-5xl">Latest Sermons</h2>
          </div>
          <Button asChild variant="link"><Link to="/sermons">Sermon library <ArrowRight className="size-4" /></Link></Button>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {SERMONS.slice(0, 3).map((s) => (
            <Link key={s.id} to="/sermons/$id" params={{ id: s.id }} className="group">
              <Card className="overflow-hidden h-full">
                <div className="relative aspect-video overflow-hidden">
                  <img src={s.thumbnail} alt={s.title} loading="lazy" className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                    <span className="size-14 rounded-full bg-gold text-gold-foreground grid place-items-center">
                      <Play className="size-5 ml-0.5" />
                    </span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-xs text-muted-foreground">{s.scripture} · {new Date(s.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>
                  <h3 className="mt-2 font-display text-xl">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.speaker}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* GIVING BANNER */}
      <section className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-[#152a4a] text-primary-foreground p-10 md:p-16">
          <div className="absolute -right-20 -bottom-20 size-80 rounded-full bg-gold/20 blur-3xl" aria-hidden />
          <div className="relative max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Generosity</p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl">Give to support the mission</h2>
            <p className="mt-4 opacity-90">Your generosity sustains worship, forms disciples, and serves our city. Thank you for partnering with us.</p>
            <Button asChild size="lg" variant="hero" className="mt-8">
              <Link to="/give"><Heart className="size-4" /> Give Online</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-page py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.28em] text-burgundy">Our Family</p>
          <h2 className="mt-3 font-display text-3xl md:text-5xl">Stories from the parish</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="p-7">
              <p className="text-5xl font-display text-gold leading-none">"</p>
              <p className="text-foreground leading-relaxed">{t.quote}</p>
              <p className="mt-6 text-sm font-medium text-muted-foreground">— {t.name}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="container-page pb-24">
        <div className="rounded-3xl border border-border bg-card p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl">Stay connected</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Subscribe to our weekly newsletter for upcoming events, devotionals, and parish updates.</p>
          <form
            onSubmit={(e) => { e.preventDefault(); alert("Thanks! We'll be in touch."); }}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
          >
            <Input required type="text" placeholder="Your name" aria-label="Name" />
            <Input required type="email" placeholder="Email address" aria-label="Email" />
            <Button type="submit" variant="default">Subscribe</Button>
          </form>
        </div>
      </section>
    </>
  );
}
