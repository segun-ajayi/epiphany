# Site settings source of truth

Last reviewed: 2026-09-24

## Purpose

The Site settings panel is the canonical editor for public church identity, contact details,
location, service times, visitor guidance, official social profiles, default SEO metadata, and
shared public-page content.
It replaces duplicated hardcoded public values while remaining portable across hosting providers.

## Ownership and permissions

- Only an authenticated `administrator` can view or change site settings.
- Editors and publishers cannot access the settings endpoints.
- Every save uses an optimistic revision number to prevent one administrator silently overwriting
  another administrator's newer changes.
- Every save and site-image upload creates an audit record.

## Storage

- Migration: `migrations/0014_site_settings.sql`
- Table: `site_settings`
- The settings are stored as validated portable JSON plus a revision, updater, and update time.
- Uploaded logos, page images, and social images use the existing portable `media_assets` table and `/media/:id` delivery
  route. No Cloudflare-specific image product is required.
- The application retains safe defaults if the record is missing or temporarily unavailable.
- Homepage, About, Visit, footer, directory introductions, testimonials, history, beliefs, FAQs,
  and shared page images live in the same portable settings document. Older documents are safely
  completed with the new fields when loaded, so no destructive schema migration is required.

## Public consumers

Saved values currently drive:

- Global header and footer identity
- Public address, phone, email, and official social links
- Home-page identity, service times, and directions
- Contact-page address, service times, map query, phone, and email
- Plan Your Visit service times, directions, visitor guidance, phone, and email
- Event-page fallback address and organizer name
- Homepage rector message and testimonials
- About-page mission, vision, history, beliefs, and visitor questions
- Visit-page introduction, expectations, questions, and closing message
- Ministries, Events, Sermons, Gallery, Contact, and Give page introductions and hero images
- Footer quotation and service-time list
- Default page metadata, social-sharing image, and Organization/WebSite structured data

Blank social-profile URLs are intentionally hidden. Only official, owner-confirmed profiles should
be entered.

## Deployment sequence

1. Review and save the settings locally.
2. Back up the remote D1 database.
3. Apply migration `0014_site_settings.sql` remotely.
4. Deploy the reviewed application build.
5. Enter or verify production settings in `/admin` and save once.
6. Check the homepage, contact page, visit page, sitemap, social preview, and structured data.

The local migration has been applied. No remote migration or deployment is authorized by this
document.
