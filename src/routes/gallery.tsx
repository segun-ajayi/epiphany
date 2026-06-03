import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { IMAGES } from "@/data/church";
import { PageHero } from "./about";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Anglican Church of Epiphany" },
      { name: "description", content: "Photos and videos from worship, outreach, and community life at Epiphany." },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: GalleryPage,
});

const CATS = ["All", "Worship", "Outreach", "Youth", "Celebrations", "Missions"] as const;

const PHOTOS = [
  { id: 1, src: IMAGES.heroChurch, cat: "Worship", h: 600 },
  { id: 2, src: IMAGES.congregation, cat: "Worship", h: 420 },
  { id: 3, src: IMAGES.churchExterior, cat: "Celebrations", h: 520 },
  { id: 4, src: IMAGES.bible, cat: "Worship", h: 480 },
  { id: 5, src: IMAGES.congregation, cat: "Youth", h: 560 },
  { id: 6, src: IMAGES.heroChurch, cat: "Missions", h: 440 },
  { id: 7, src: IMAGES.churchExterior, cat: "Outreach", h: 620 },
  { id: 8, src: IMAGES.bible, cat: "Worship", h: 380 },
  { id: 9, src: IMAGES.congregation, cat: "Celebrations", h: 500 },
];

function GalleryPage() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered = useMemo(
    () => (cat === "All" ? PHOTOS : PHOTOS.filter((p) => p.cat === cat)),
    [cat],
  );

  return (
    <>
      <PageHero eyebrow="Gallery" title="Moments from our life together" image={IMAGES.congregation} />

      <section className="container-page py-16">
        <div className="flex flex-wrap gap-2 mb-10">
          {CATS.map((c) => (
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

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [&>*]:mb-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setLightbox(p.src)}
              className="block w-full overflow-hidden rounded-xl group break-inside-avoid"
            >
              <img
                src={p.src}
                alt={`${p.cat} photo`}
                loading="lazy"
                style={{ height: p.h }}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </button>
          ))}
        </div>

        {/* VIDEO GALLERY */}
        <div className="mt-20">
          <h2 className="font-display text-3xl md:text-4xl">Video gallery</h2>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="aspect-video rounded-2xl overflow-hidden bg-primary">
                <iframe
                  className="size-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title={`Church video ${i}`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {lightbox && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" role="dialog" aria-modal onClick={() => setLightbox(null)}>
          <button aria-label="Close" onClick={() => setLightbox(null)} className="absolute top-4 right-4 size-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X />
          </button>
          <img src={lightbox} alt="" className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl" />
        </div>
      )}
    </>
  );
}
