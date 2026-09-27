import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicGalleryAlbum } from "@/lib/api/content.functions";
import { absoluteUrl, safeJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/gallery_/$id")({
  loader: async ({ params }) => {
    const album = await getPublicGalleryAlbum({ data: { slug: params.id } });
    if (!album) throw notFound();
    return album;
  },
  head: ({ loaderData: album }) => {
    if (!album) return {};
    const url = absoluteUrl(`/gallery/${encodeURIComponent(album.slug)}`);
    const description = album.seoDescription || album.summary;
    return {
      meta: [
        { title: album.seoTitle || `${album.title} — Gallery` },
        { name: "description", content: description },
        { property: "og:title", content: album.title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:image", content: absoluteUrl(album.coverImage) },
        { property: "og:image:alt", content: album.coverImageAlt },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "ImageGallery",
            name: album.title,
            description,
            url,
            datePublished: album.eventDate || undefined,
            image: album.photos.map((photo) => ({
              "@type": "ImageObject",
              contentUrl: absoluteUrl(photo.image),
              caption: photo.caption || photo.imageAlt,
            })),
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-page py-32 text-center">
      <h1 className="font-display text-3xl">Album not found</h1>
      <Button asChild className="mt-6">
        <Link to="/gallery">Back to gallery</Link>
      </Button>
    </div>
  ),
  errorComponent: () => (
    <div className="container-page py-32 text-center">
      <h1 className="font-display text-3xl">Gallery is temporarily unavailable</h1>
      <Button asChild className="mt-6">
        <Link to="/gallery">Back to gallery</Link>
      </Button>
    </div>
  ),
  component: GalleryAlbumPage,
});

function GalleryAlbumPage() {
  const album = Route.useLoaderData();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const next = useCallback(
    () => setOpenIndex((index) => (index === null ? null : (index + 1) % album.photos.length)),
    [album.photos.length],
  );
  const previous = useCallback(
    () =>
      setOpenIndex((index) =>
        index === null ? null : (index - 1 + album.photos.length) % album.photos.length,
      ),
    [album.photos.length],
  );
  useEffect(() => {
    if (openIndex === null) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      triggerRefs.current[openIndex]?.focus();
    };
  }, [openIndex, next, previous]);
  const current = openIndex === null ? null : album.photos[openIndex];
  return (
    <article className="container-page py-12 md:py-20">
      <Button asChild variant="ghost" size="sm">
        <Link to="/gallery">
          <ArrowLeft className="size-4" /> All albums
        </Link>
      </Button>
      <header className="mt-8 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-burgundy">
          Photo album
        </p>
        <h1 className="mt-3 font-display text-4xl md:text-6xl">{album.title}</h1>
        {album.eventDate && (
          <p className="mt-4 text-sm text-muted-foreground">
            {new Intl.DateTimeFormat("en-US", {
              timeZone: "UTC",
              month: "long",
              day: "numeric",
              year: "numeric",
            }).format(new Date(`${album.eventDate}T00:00:00Z`))}
          </p>
        )}
        <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
          {album.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {album.relatedEventSlug && (
            <Button asChild variant="outline">
              <Link to="/events/$id" params={{ id: album.relatedEventSlug }}>
                Related event
              </Link>
            </Button>
          )}
          {album.relatedMinistrySlug && (
            <Button asChild variant="outline">
              <Link to="/ministries/$id" params={{ id: album.relatedMinistrySlug }}>
                Related ministry
              </Link>
            </Button>
          )}
        </div>
      </header>
      <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {album.photos.map((photo, index) => (
          <figure
            key={photo.id}
            className="break-inside-avoid overflow-hidden rounded-xl border bg-card"
          >
            <button
              ref={(node) => {
                triggerRefs.current[index] = node;
              }}
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`Open photo: ${photo.imageAlt}`}
              className="block w-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <img
                src={photo.thumbnail}
                srcSet={`${photo.thumbnail} 640w, ${photo.image} 1600w`}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                alt={photo.imageAlt}
                width={photo.width ?? undefined}
                height={photo.height ?? undefined}
                loading={index < 3 ? "eager" : "lazy"}
                className="h-auto w-full object-cover transition duration-700 hover:scale-105"
              />
            </button>
            {photo.caption && (
              <figcaption className="p-4 text-sm text-muted-foreground">{photo.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo: ${current.imageAlt}`}
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            ref={closeRef}
            type="button"
            aria-label="Close photo"
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/10 text-white"
            onClick={() => setOpenIndex(null)}
          >
            <X />
          </button>
          {album.photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                className="absolute left-4 grid size-11 place-items-center rounded-full bg-white/10 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  previous();
                }}
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                className="absolute right-4 grid size-11 place-items-center rounded-full bg-white/10 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
              >
                <ChevronRight />
              </button>
            </>
          )}
          <figure
            className="flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.image}
              alt={current.imageAlt}
              className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain"
            />
            <figcaption className="text-sm text-white/80">
              {current.caption || current.imageAlt} · {openIndex! + 1} / {album.photos.length}
            </figcaption>
          </figure>
        </div>
      )}
    </article>
  );
}
