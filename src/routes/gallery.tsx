import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { GALLERY, GALLERY_CATEGORIES, IMAGES } from "@/data/church";
import { PageHero } from "./about";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Anglican Church of Epiphany" },
      {
        name: "description",
        content: "Photos and videos from worship, outreach, and community life at Epiphany.",
      },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: GalleryPage,
});

const HEIGHTS = [420, 480, 520, 560, 600, 620, 380, 500, 440];
const SWIPE_THRESHOLD = 50;

function GalleryPage() {
  const [cat, setCat] = useState<string>("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () => (cat === "All" ? GALLERY : GALLERY.filter((p) => p.category === cat)),
    [cat],
  );

  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastTriggerIndex = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const open = useCallback((i: number) => {
    lastTriggerIndex.current = i;
    setLightboxIndex(i);
  }, []);

  const close = useCallback(() => setLightboxIndex(null), []);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : (i + 1) % filtered.length));
  }, [filtered.length]);

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : (i - 1 + filtered.length) % filtered.length));
  }, [filtered.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, close, next, prev]);

  // Focus management: move focus into lightbox on open, restore on close
  useEffect(() => {
    if (lightboxIndex !== null) {
      const prevActive = document.activeElement as HTMLElement | null;
      // Defer until the close button is mounted
      const id = window.setTimeout(() => closeBtnRef.current?.focus(), 0);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        window.clearTimeout(id);
        document.body.style.overflow = prevOverflow;
        const idx = lastTriggerIndex.current;
        const trigger = idx !== null ? triggerRefs.current[idx] : null;
        (trigger ?? prevActive)?.focus?.();
      };
    }
  }, [lightboxIndex]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0) next();
    else prev();
  };

  const current = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="Moments from our life together"
        image={IMAGES.congregation}
      />

      <section className="container-page py-16">
        {GALLERY_CATEGORIES.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {GALLERY_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-2 text-sm rounded-full border transition ${
                  cat === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-muted-foreground">
            No photos yet. Drop images into <code>src/assets/galleryPictures/</code> to populate the
            gallery.
          </p>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [&>*]:mb-4">
            {filtered.map((p, i) => (
              <button
                key={p.id}
                ref={(el) => {
                  triggerRefs.current[i] = el;
                }}
                onClick={() => open(i)}
                aria-label={`Open photo: ${p.alt}`}
                className="block w-full overflow-hidden rounded-xl group break-inside-avoid focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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

        {/*<div className="mt-20">*/}
        {/*  <h2 className="font-display text-3xl md:text-4xl">Video gallery</h2>*/}
        {/*  <div className="mt-8 grid md:grid-cols-2 gap-6">*/}
        {/*    {[1, 2].map((i) => (*/}
        {/*      <div key={i} className="aspect-video rounded-2xl overflow-hidden bg-primary">*/}
        {/*        <iframe*/}
        {/*          className="size-full"*/}
        {/*          src="https://www.youtube.com/embed/dQw4w9WgXcQ"*/}
        {/*          title={`Church video ${i}`}*/}
        {/*          loading="lazy"*/}
        {/*          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"*/}
        {/*          allowFullScreen*/}
        {/*        />*/}
        {/*      </div>*/}
        {/*    ))}*/}
        {/*  </div>*/}
        {/*</div>*/}
      </section>

      {current && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo: ${current.alt}`}
          onClick={close}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            ref={closeBtnRef}
            aria-label="Close lightbox"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="absolute top-4 right-4 size-11 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X />
          </button>

          {filtered.length > 1 && (
            <>
              <button
                aria-label="Previous photo"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 size-11 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronLeft />
              </button>
              <button
                aria-label="Next photo"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 size-11 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronRight />
              </button>
            </>
          )}

          <figure
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] flex flex-col items-center gap-3"
          >
            <img
              src={current.src}
              alt={current.alt}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl"
            />
            <figcaption className="text-white/80 text-sm" aria-live="polite">
              {current.alt} · {lightboxIndex! + 1} / {filtered.length}
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
