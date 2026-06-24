import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { GALLERY, GALLERY_CATEGORIES, IMAGES } from "@/data/church";
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

// Deterministic-but-varied masonry heights so the layout stays interesting
// regardless of which images are dropped into /assets/galleryPictures.
const HEIGHTS = [420, 480, 520, 560, 600, 620, 380, 500, 440];

function GalleryPage() {
  const [cat, setCat] = useState<string>("All");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered = useMemo(
    () => (cat === "All" ? GALLERY : GALLERY.filter((p) => p.category === cat)),
    [cat],
  );

  return (
    <>
      <PageHero eyebrow="Gallery" title="Moments from our life together" image={IMAGES.congregation} />

      <section className="container-page py-16">
        {GALLERY_CATEGORIES.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {GALLERY_CATEGORIES.map((c) => (
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
        )}

        {filtered.length === 0 ? (
          <p className="text-muted-foreground">
            No photos yet. Drop images into <code>src/assets/galleryPictures/</code> to populate the gallery.
          </p>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [&>*]:mb-4">
            {filtered.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setLightbox(p.src)}
                className="block w-full overflow-hidden rounded-xl group break-inside-avoid"
              >
                <img
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  style={{ height: HEIGHTS[i % HEIGHTS.length] }}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </button>
            ))}
          </div>
        )}

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
