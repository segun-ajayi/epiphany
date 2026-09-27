# Launch readiness audit

Last reviewed: 2026-09-25

## Purpose

This document is the source of truth for deciding when the rebuilt website is ready to replace the current production release. It covers the local Cloudflare-style build only. No production deployment, remote database migration, or live-content change was made during this audit.

The website can establish a strong technical and local-search foundation, but no developer or agency can guarantee a number-one Google ranking. Sustainable ranking depends on accurate, useful content, local authority, Google Business Profile quality, legitimate references, and continued measurement in Google Search Console.

## Audit result

The application is technically ready for owner content review and a controlled deployment rehearsal. Automated tests, type checking, the production build, focused linting, metadata checks, sitemap URLs, security-response checks, responsive browser review, and the internal-link crawl pass locally.

It is not yet ready for an unattended production release because several owner-controlled identity, leadership, and payment details remain incomplete.

## Verification completed

- Admin and application test suite: 84 of 84 tests passed.
- TypeScript validation: passed with no errors.
- Production-style build: passed.
- Public internal-link crawl: 18 unique links checked, 0 broken.
- Static public routes: returned HTTP 200 during the audit.
- Sitemap dynamic URLs: returned HTTP 200.
- Unknown routes: correctly returned HTTP 404.
- Private contact API GET request: correctly returned HTTP 405.
- Public-page metadata: one visible H1, descriptive title, meta description, and canonical URL were confirmed across the audited route set.
- Empty sermon library: remains `noindex` and does not publish thin sermon URLs to the sitemap.
- Security headers: `nosniff`, clickjacking protection, referrer policy, and restricted browser permissions are present. HSTS is intentionally emitted only over HTTPS.
- The local preview remains available at `http://127.0.0.1:8787` for owner review.

The rebuilt homepage and administration workspace were reviewed at a 390 × 844 phone viewport. The mobile header, content flow, service cards, responsive administration navigation, content table, and expanded Site & pages editor rendered without a blocking layout problem.

### Admin-managed content expansion

- Converted the administration menu into a responsive grouped side navigation.
- Persisted the confirmed local church identity, address, service times, and shared page content in D1.
- Made the header/footer logo, footer contact and service information, and footer quotation admin-managed.
- Made the homepage hero, rector message, section introductions, giving message, images, and testimonials admin-managed.
- Made About mission, vision, history, beliefs, visitor questions, and imagery admin-managed.
- Made Visit introduction, expectations, questions, closing message, and imagery admin-managed.
- Made the Ministries, Events, Sermons, Gallery, Contact, and Give introductions and hero images admin-managed.
- Preserved only structural, safety, consent, validation, error, and accessibility copy as intentional application text.
- Added backward-compatible settings completion so older saved documents retain their values while gaining new fields.

## Findings resolved in this audit

### Broken and misleading links

- Replaced the homepage's stale hardcoded sermon cards with database-backed published sermons.
- Added an honest empty state when no sermons are published, instead of linking to a demonstration sermon that returned 404.
- Prevented unsafe or nonexistent gallery relationship slugs from rendering as public event or ministry links.
- Replaced the event-page map placeholder with the actual event location and a Google Maps directions link.

### Security and privacy

- Added site-wide response hardening for MIME sniffing, framing, referrer leakage, and unnecessary browser permissions.
- Preserved the stricter no-referrer behavior for admin responses.
- Added HTTPS-only HSTS behavior so local HTTP development is not disrupted.

### Accessibility and navigation

- Added a keyboard-visible “Skip to main content” link.
- Made the main content region focusable for reliable skip-link behavior.
- Added Escape-key closing and an explicit navigation relationship to the mobile menu.

### Content integrity

- Removed obsolete hardcoded demonstration events and sermons from the static data module.
- Removed generic social-profile placeholders from that module.
- Kept the real database records and administrator-controlled content intact; no local or production content was deleted.

## Owner actions required before production

1. Upload approved leadership portraits and complete the two leadership biographies. Confirm every displayed title and name.
2. Confirm the church's exact official name and diocesan wording, and add any official social-profile URLs.
3. Confirm ownership and the real destination details for Zelle and Cash App. Keep any unverified payment method disabled.
4. Publish genuine sermon recordings with accurate speakers, dates, scripture references, summaries, notes, and accessible media.
5. Perform the final owner content review, including giving instructions and newsletter unsubscribe links.

These records are deliberately not changed automatically because they require church-owner knowledge and approval.

On 2026-09-25, the owner confirmed that the existing event and gallery information previously flagged as possible test content is accurate. Those records are therefore approved content and are not launch blockers.

## Controlled production gate

Do not deploy until every item below is checked:

- [ ] Owner-controlled content issues above are resolved or explicitly approved.
- [ ] A backup/export of the production D1 database is captured and recovery is understood.
- [ ] Production migrations are reviewed and applied in order through `0022_leadership.sql`.
- [ ] Required production environment values and secrets are configured without committing secrets to Git.
- [ ] Google OAuth production origin and callback URLs are verified.
- [ ] Newsletter provider, sender identity, unsubscribe flow, and reconciliation are tested with a real inbox.
- [ ] Giving methods show only verified church-owned destinations.
- [ ] A production preview or staged deployment is reviewed before traffic is switched.
- [ ] Post-deployment smoke tests cover the homepage, About, Visit, Ministries, Events, Sermons, Gallery, Give, Contact, Admin, newsletter signup, and one dynamic detail page of each type.
- [ ] `robots.txt`, `/sitemap.xml`, canonical URLs, structured data, and HTTP status codes are rechecked on `https://acehou.org`.
- [ ] Google Search Console ownership is verified and the production sitemap is submitted.

## Post-launch SEO work

- Complete and maintain Google Business Profile with exactly matching church identity and service information.
- Monitor indexing, coverage, rich-result errors, Core Web Vitals, and search queries in Google Search Console.
- Publish useful local content: complete ministry information, visitor answers, event detail and recaps, and sermon transcripts or substantive notes.
- Earn genuine references from the diocese, partner ministries, community organizations, and event partners. Never buy links or fabricate reviews.
- Review performance weekly during launch, monthly after stabilization, and record material SEO/content changes so ranking changes can be interpreted.

## Decision record

- Local development and review come before any production change.
- Cloudflare's free-tier architecture remains the target; paid services are not required by this plan.
- Portable application-level authentication, content, and provider abstractions remain preferred so a future migration is practical.
- Production remains untouched until the owner explicitly approves deployment.
