# Gallery source of truth

**Status:** Implemented locally on September 24, 2026. No production migration, gallery import, or
deployment has been performed.

## Publishing model

Gallery content is managed in **Admin → Gallery**. Editors may create and change draft albums;
publishers and administrators may publish or archive them. The public URL is generated from the
album title and becomes permanent after first publication.

Each album includes a title, summary, description, optional event date, display order, optional
related event or ministry URL name, publication state and time, and optional search title and
description. An album must contain at least one photograph before it can be published.

## Photograph workflow and limits

- Administrators may select several JPG, PNG, or WebP files in one action. They are optimized in
  the browser and then uploaded one at a time so a request remains small and recoverable.
- New uploads are converted into two signature-checked WebP files before leaving the browser: a
  thumbnail capped at 100 KB and a full gallery image capped at 500 KB. Originals are not stored.
- Existing photographs uploaded before migration `0019` remain valid and use their current image
  as a thumbnail fallback until they are replaced.
- Each album is limited to 100 photographs to protect the Cloudflare free-tier database and keep
  public pages usable.
- Every photograph requires an accessible description. A visible caption is optional.
- Photographs support explicit display order and one chosen album cover. The first photograph is
  selected as the cover automatically until an editor chooses another.
- Removing a photograph permanently removes its database media record after confirmation.

This model intentionally stores optimized web photographs in the portable database and does not
depend on Cloudflare Images or R2. If usage approaches D1's free allowance, the storage adapter can
be moved to an object store without changing album URLs or content records.

## Public and search behavior

- `/gallery` lists only published albums whose Houston publication time has arrived and serves the
  responsive thumbnail size appropriate to the visitor's screen.
- `/gallery/{slug}` is the permanent album page with keyboard-accessible photo viewing.
- Album pages include canonical links, social-sharing metadata, and `ImageGallery` structured data.
- Published album pages are added automatically to `sitemap.xml`.
- Optional related event and ministry links create useful internal links for visitors and search.

## Production deployment order

Before production deployment: export the remote database, apply `0018_gallery.sql`, build and
deploy the application, create one small draft album, test uploads and descriptions, preview its
permanent page, then publish. Existing build-time gallery photographs are not imported
automatically; review and upload only photographs approved for public use.
