import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Images } from "lucide-react";
import { PageHero } from "./about";
import { IMAGES } from "@/data/church";
import { getPublicGalleryAlbums } from "@/lib/api/content.functions";
import { absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/gallery")({
  loader: () => getPublicGalleryAlbums(),
  head: () => ({
    meta: [
      { title: "Gallery — Anglican Church of Epiphany" },
      {
        name: "description",
        content:
          "See worship, outreach, fellowship, and community life at Anglican Church of the Epiphany in Houston.",
      },
      { property: "og:url", content: absoluteUrl("/gallery") },
      { property: "og:image", content: absoluteUrl(IMAGES.congregation) },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/gallery") }],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const albums = Route.useLoaderData();
  const { siteSettings } = getRouteApi("__root__").useLoaderData();
  const hero = siteSettings.pages.gallery;
  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        subtitle={hero.subtitle}
        image={hero.imagePath || IMAGES.congregation}
      />
      <section className="container-page py-16 md:py-24">
        {!albums.length && (
          <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-10 text-center">
            <Images className="mx-auto size-10 text-gold" aria-hidden />
            <h2 className="mt-4 font-display text-2xl">New photographs are coming soon</h2>
            <p className="mt-3 text-muted-foreground">
              We are preparing albums from worship and community life.
            </p>
          </div>
        )}
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <article
              key={album.id}
              className="group overflow-hidden rounded-2xl border bg-card shadow-sm"
            >
              <Link to="/gallery/$id" params={{ id: album.slug }} className="block">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={album.coverThumbnail}
                    srcSet={`${album.coverThumbnail} 640w, ${album.coverImage} 1600w`}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    alt={album.coverImageAlt}
                    width={album.coverWidth ?? undefined}
                    height={album.coverHeight ?? undefined}
                    loading="lazy"
                    className="size-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  {album.eventDate && (
                    <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-burgundy">
                      <Calendar className="size-4" />
                      {new Intl.DateTimeFormat("en-US", {
                        timeZone: "UTC",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(`${album.eventDate}T00:00:00Z`))}
                    </p>
                  )}
                  <h2 className="mt-2 font-display text-2xl">{album.title}</h2>
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{album.summary}</p>
                  <p className="mt-5 flex items-center justify-between text-sm font-medium text-primary">
                    <span>
                      {album.photoCount} photo{album.photoCount === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1">
                      View album <ArrowRight className="size-4" />
                    </span>
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
