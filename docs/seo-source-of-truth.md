# SEO source of truth

Last reviewed: 2026-09-25

## Goal and operating rule

Build the strongest sustainable organic-search presence for Anglican Church of the Epiphany in Houston while keeping the Cloudflare hosting cost at $0. No developer, agency, or tool can guarantee a number-one Google ranking. Our controllable goal is to make the site technically crawlable, locally relevant, fast, trustworthy, and more useful than competing pages for the searches the church genuinely serves.

Production changes require review and explicit approval. Work is implemented and tested locally first.

The latest local technical review and the production gate are recorded in [Launch readiness audit](./launch-readiness-audit.md). That audit must be cleared before deployment.

## Canonical identity

- Public origin: `https://acehou.org`
- Organization name: Anglican Church of the Epiphany, Houston
- Location used for structured data: 13111 Westheimer Road, Suite 130, Houston, TX 77077, US
- Public phone: +1 (281) 870-3231
- Public email: acerichmondtx28@gmail.com

Any change to these facts must be made consistently in website content, structured data, Google Business Profile, and other church listings.

## Implemented technical foundation

- Absolute canonical URLs on every public static page and dynamic event/sermon page.
- Absolute Open Graph URLs and images for reliable social previews.
- A crawlable XML sitemap containing eligible public static pages and published upcoming event pages only.
- `robots.txt` advertises the sitemap and keeps `/admin` and `/api/` out of routine crawling.
- Default index/follow policy with large image previews enabled; private admin/newsletter-browser routes retain their separate noindex controls.
- Server-rendered Organization and WebSite JSON-LD based only on confirmed public contact details.
- Server-rendered Event JSON-LD for published events, using the event's actual dates, image, venue, and address.
- Descriptive default metadata that speaks to visitors rather than describing the website implementation.
- Placeholder social profiles are intentionally excluded from structured data.
- The sermon library is database-backed. It remains `noindex` and excluded from the sitemap while empty; deliberately published sermons receive recording metadata and sitemap entries.
- A dedicated, crawlable Plan Your Visit page provides confirmed service times, location, directions, expectations, and contact pathways without inventing parking, childcare, or accessibility claims.
- The primary logo, rector portrait, and default social image now use smaller delivery assets; their original source files are retained for future editing.
- Administrators can manage canonical church identity, contact details, service times, visitor guidance, official social profiles, and default SEO metadata from the portable Site settings panel.

## Known content and performance gaps

### Must resolve before serious ranking work

1. Confirm the exact official church and denominational name. The current phrase `Diocese of All Nation (ACNA)` appears in site content and should be owner-verified for spelling and official affiliation.
2. Replace generic Facebook, Instagram, and YouTube links with official profile URLs, then add those verified profiles to Organization structured data.
3. Confirm all public facts: founding year, rector biography and credentials, address formatting, phone, service times, beliefs, and ministry descriptions.
4. Replace example leadership email addresses and any demonstration sermon/video records before promoting those pages to search engines.
5. Supply genuine sermon recordings, transcripts or useful summaries. Search visibility should not rely on thin or placeholder content.
6. Decide the primary local search themes from actual ministry priorities, not keyword stuffing. Likely starting themes include `Anglican church Houston`, `Anglican church West Houston`, `church near Westheimer Road`, and visitor/event-specific searches.

### Performance work

- Convert and resize heavy raster assets. Current notable files include the approximately 1.68 MB source logo, 1.36 MB social image, and 871 KB rector portrait.
- Use responsive `srcset`/`sizes` for major content images and avoid serving desktop-sized images to mobile devices.
- Self-host or carefully measure the current Google Fonts dependency.
- Measure production field data and target Google's recommended Core Web Vitals thresholds: LCP at or below 2.5 seconds, INP at or below 200 ms, and CLS at or below 0.1 at the 75th percentile.

## Local SEO and authority plan

1. Claim or update Google Business Profile with exactly matching name, address, phone, service times, primary category, website, photos, and accessibility details.
2. Verify `https://acehou.org` in Google Search Console, submit `/sitemap.xml`, and monitor indexing, page experience, search queries, and manual actions.
3. Keep the Plan Your Visit page current. Add verified parking, entrance, children's arrangements, accessibility details, and service duration when church leadership confirms them.
4. Build focused, substantial ministry pages only where the church can keep information current. Each should explain who it serves, when and where it meets, what a newcomer should expect, and how to contact a real leader.
5. Publish event pages early enough to be discovered, keep dates/locations accurate, and preserve useful recaps after events instead of creating disposable duplicate pages.
6. Add complete sermon transcripts or structured notes with real speakers, dates, scripture references, and working media.
7. Earn legitimate local references from the diocese, partner ministries, community organizations, local directories, and event partners. Do not buy links or use mass directory/spam schemes.
8. Request honest Google reviews through normal pastoral/community interactions; never incentivize or fabricate reviews.

## Measurement cadence

- Weekly during launch: review Search Console coverage, sitemap processing, rich-result errors, top queries, and unexpected 404s.
- Monthly: compare non-branded clicks, local-intent clicks, event discovery, directions/calls, newsletter signups, and visit enquiries.
- Quarterly: refresh declining pages, remove obsolete claims, review competitor usefulness, and test Core Web Vitals on representative mobile devices.
- Record SEO changes and their dates so performance shifts can be interpreted rather than guessed.

## Release checklist

- Build and automated tests pass.
- Every indexable page has one descriptive title, one useful meta description, one canonical URL, and a visible H1.
- Sitemap contains only canonical, public, indexable URLs and returns HTTP 200.
- `robots.txt` returns HTTP 200 and references the production sitemap.
- Structured data passes Google's Rich Results Test and matches visible page content.
- There are no placeholder identities, fake media links, example emails, or unverified claims on pages being promoted.
- Important internal links are crawlable anchor elements.
- Mobile navigation, forms, images, and primary actions work without layout shifts.
- Production deployment and Search Console submission occur only after approval.

## Primary guidance

- Google Search Essentials: https://developers.google.com/search/docs/essentials
- Canonical URL guidance: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Organization structured data: https://developers.google.com/search/docs/appearance/structured-data/organization
- Event structured data: https://developers.google.com/search/docs/appearance/structured-data/event
- Core Web Vitals: https://developers.google.com/search/docs/appearance/core-web-vitals
