# D1 migrations

Wrangler applies the numbered SQL files in this directory to the database bound as `DB`.

Local workflow:

```text
npm run db:migrate:local
npm run db:seed:local
npm run db:admin:local
```

Remote migrations are deliberately separate from the normal build and deploy commands. Review the
database export and migration output before running `npm run db:migrate:remote`.

Cloudflare D1 migrations are forward-only. The `rollback/` directory contains reviewed manual
recovery SQL and is not applied automatically by Wrangler.

Migration 0002 adds roles, audit records, and optimistic revision counters. Migration 0005 adds
portable uploaded-image storage with an application limit below D1's row/BLOB ceiling. Migration
0006 adds the portable newsletter subscriber and consent register. Migration 0007 adds the
portable newsletter delivery-provider choice and per-subscriber synchronization ledger. Provider
credentials are deliberately excluded from the database and remain deployment secrets. The initial
Migration 0008 adds provider-status reconciliation timestamps and errors so remote opt-outs can be
imported without relying on paid webhooks. Provider reconciliation is deliberately one-way: it may
suppress a local subscriber but never restores one.
Migration 0009 records daily automatic reconciliation health. The portable reconciliation service
remains host-independent; Cloudflare Cron only invokes it on the current deployment.
Migration 0010 adds the active portable HTML newsletter design choice. Email-provider credentials
remain outside the database, and choosing a design never sends a message.
Migration 0011 adds a provider-neutral event-newsletter outbox and its automatic-workflow health
state. Publishing an event and queuing its newsletter happen in one database transaction; external
delivery is retried separately so an email-provider outage never rolls back published content.
Migration 0012 adds portable giving configuration, payment-method presentation, designations,
reviewed impact examples, and donation receipt requests. The website never stores payment
credentials or confirms transfers; administrators reconcile receipt requests against the external
church-owned payment accounts.
Migration 0013 marks local Giving simulations explicitly. Simulated payment destinations are
automatically suppressed on non-local origins.
Migration 0014 adds a portable, revision-protected site-settings record for public identity,
contact details, visitor guidance, service times, social profiles, and default SEO metadata.
Migration 0015 expands ministry records with meeting location, leader role, phone contact, newcomer
guidance, and clear joining instructions for their permanent public pages.
Migration 0016 adds portable sermon records, external recording links, optimized thumbnail metadata,
publication controls, and indexes for the public sermon library. Large recordings remain outside D1.
Migration 0017 expands the portable media table to accept signature-checked sermon-notes PDFs while
retaining its 1.25 MB per-file ceiling. Its manual rollback necessarily omits PDF rows.
Migration 0018 adds portable gallery albums and photographs, publication controls, permanent album
URLs, captions, accessible descriptions, cover selection, and ordering. Gallery images reuse the
signature-checked 1.25 MB media store and each album is capped by the application at 100 photos.
Migration 0019 adds responsive gallery-image metadata and a separate thumbnail path. New gallery
uploads store a WebP thumbnail of at most 100 KB and a full WebP image of at most 500 KB; older
photographs continue to work by using their original optimized image as the thumbnail fallback.
Migration 0020 adds the private contact-message inbox with explicit consent, message categories,
workflow status, internal notes, duplicate suppression, and indexes. Public submissions are also
protected by same-origin, timing, honeypot, size, and shared hourly rate checks.
Migration 0021 adds optional event registration, private attendee records, party-size capacity
enforcement, status and internal-note management, and CSV export. Normal public events continue to
use “no registration needed”; the form appears only when an administrator explicitly opens
registration.
Migration 0022 adds ordered, publishable clergy and staff profiles with optional verified contact
and social fields plus portable uploaded photos. It migrates the two names and roles already shown
on the site while deliberately discarding the old placeholder email addresses and social links.

The initial
Administrator is provisioned separately by the approved, idempotent `seed/initial-admin.sql`, not
by a schema migration. Its remote command is `npm run db:admin:remote`; do not run it until the
owner-approved Google setup and database preparation in `docs/admin-setup.md` have been reviewed.
