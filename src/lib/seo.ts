export const SITE = {
  origin: "https://acehou.org",
  name: "Anglican Church of the Epiphany, Houston",
  shortName: "Epiphany Houston",
  description:
    "Join Anglican Church of the Epiphany in Houston, Texas for worship, biblical teaching, prayer, fellowship, and community outreach.",
  locale: "en_US",
} as const;

export function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE.origin}${path}`;
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
