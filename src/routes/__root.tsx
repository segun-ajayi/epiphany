import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { IMAGES } from "@/data/church";
import { absoluteUrl, safeJsonLd, SITE } from "@/lib/seo";
import { getPublicSiteSettings } from "@/lib/api/site-settings.functions";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings/defaults";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => ({ siteSettings: await getPublicSiteSettings() }),
  head: ({ loaderData }) => {
    const settings = loaderData?.siteSettings ?? DEFAULT_SITE_SETTINGS;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: settings.defaultSeoTitle },
        {
          name: "description",
          content: settings.defaultSeoDescription,
        },
        {
          name: "robots",
          content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
        { property: "og:site_name", content: settings.churchName },
        { property: "og:locale", content: SITE.locale },
        { property: "og:title", content: settings.defaultSeoTitle },
        {
          property: "og:description",
          content: settings.defaultSeoDescription,
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: SITE.origin },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: settings.defaultSeoTitle },
        {
          name: "twitter:description",
          content: settings.defaultSeoDescription,
        },
        {
          property: "og:image",
          content: absoluteUrl(settings.socialImagePath),
        },
        {
          name: "twitter:image",
          content: absoluteUrl(settings.socialImagePath),
        },
      ],
      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap",
        },
        {
          rel: "icon",
          type: "image/png",
          href: "/faviconACE.png",
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: safeJsonLd({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${SITE.origin}/#organization`,
                name: settings.churchName,
                alternateName: settings.shortName,
                url: SITE.origin,
                logo: {
                  "@type": "ImageObject",
                  url: absoluteUrl(settings.logoImagePath || IMAGES.logo),
                  width: 512,
                  height: 512,
                },
                email: settings.email,
                telephone: settings.phone,
                sameAs:
                  [settings.facebookUrl, settings.instagramUrl, settings.youtubeUrl].filter(Boolean)
                    .length > 0
                    ? [settings.facebookUrl, settings.instagramUrl, settings.youtubeUrl].filter(
                        Boolean,
                      )
                    : undefined,
                address: {
                  "@type": "PostalAddress",
                  streetAddress: [settings.addressLine1, settings.addressLine2]
                    .filter(Boolean)
                    .join(", "),
                  addressLocality: settings.city,
                  addressRegion: settings.region,
                  postalCode: settings.postalCode,
                  addressCountry: settings.countryCode,
                },
              },
              {
                "@type": "WebSite",
                "@id": `${SITE.origin}/#website`,
                url: SITE.origin,
                name: settings.churchName,
                publisher: { "@id": `${SITE.origin}/#organization` },
                inLanguage: "en-US",
              },
            ],
          }),
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { siteSettings } = Route.useLoaderData();

  return (
    <QueryClientProvider client={queryClient}>
      <a
        href="#main"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>
      <SiteHeader settings={siteSettings} />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter settings={siteSettings} />
    </QueryClientProvider>
  );
}
