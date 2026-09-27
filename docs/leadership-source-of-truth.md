# Leadership source of truth

## Purpose

Clergy and staff profiles on the About page are database-backed and managed from Admin →
Leadership. The old source-code array and its placeholder contact details are not used.

## Data and publication rules

Each profile has a generated identifier, name, role, optional biography, optional public email and
phone, optional Facebook/Instagram/LinkedIn URLs, optional photo and description, display order,
publication status, revision, timestamps, and accountable administrator IDs.

- New profiles begin as drafts.
- Editors may create and edit drafts. Publishers and administrators may publish or archive.
- Published profiles are ordered numerically and then by name.
- Empty contact fields render nothing; the site never invents an address or social profile.
- Social links must use HTTPS. Contact information should be saved only after the person approves
  public display.
- Published profiles contribute `Person` entries to the About page's structured data.

## Images

JPG, PNG, and WebP files are resized and converted in the browser before upload, signature-checked
by the server, capped below the D1 row limit, and served from immutable `/media/{id}` URLs. Replacing
or deliberately removing a profile photo also removes the old uploaded media record.

## Initial migration

Migration 0022 preserves the two names and roles that were already displayed publicly. It does not
copy the former `example.com` email addresses or generic social links. The initial profiles use
letter-based placeholders until approved photographs are uploaded in Admin.

## Cost and portability

Profiles and uploaded images use the existing SQLite/D1 abstraction and require no new provider or
paid Cloudflare service. They move with the documented portable database export.

## Production gate

Before production deployment, review spelling and titles, add only approved biographies and
contact details, upload licensed photographs with accurate descriptions, confirm display order,
and inspect the About page on mobile and desktop. Back up D1 before applying migration 0022.
