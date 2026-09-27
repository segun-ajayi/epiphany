# Sermons source of truth

**Status:** Implemented locally on September 24, 2026. No production migration, content import, or
deployment has been performed.

## Publishing model

Sermons are managed in **Admin → Sermons** and stored in the portable application database. A
sermon can be a draft, scheduled publication, published, or archived. Its URL slug is generated
from the title and becomes permanent after first publication.

Publishing requires:

- title, summary, full description, preacher, sermon date, and Bible passage;
- at least one genuine YouTube or external audio URL;
- an image description whenever a thumbnail is uploaded; and
- a publication time, or a blank publication time for immediate publication.

Series, topic, duration, notes, custom search title, and custom search description are optional.

## Zero-cost media policy

The website does not upload or store large video or audio recordings. Video remains on YouTube and
audio remains on the church's chosen external provider. The database stores only secure links,
text metadata, and an optimized thumbnail. This avoids unnecessary Cloudflare storage and delivery
costs and keeps future hosting migration straightforward.

YouTube links must use `https://youtube.com` or `https://youtu.be`. Audio links must use HTTPS.
Sermon notes may use an HTTPS URL, a deployed local file path, or a PDF uploaded in Admin. Uploaded
PDFs are signature-checked and limited to 1.25 MB so they remain suitable for portable D1 storage.
The Admin thumbnail workflow uses the existing browser optimization and application media limit.

## Public and search behavior

- `/sermons` loads only deliberately published records whose publication time has arrived.
- `/sermons/{slug}` is the permanent detail page.
- The library supports search plus speaker and series filters.
- Detail pages include canonical, social-sharing, and VideoObject or AudioObject metadata.
- Published sermon pages and the library are added automatically to `sitemap.xml`.
- When no genuine sermons are published, the library shows a useful empty state, remains `noindex`,
  and is excluded from the sitemap. No demonstration recording is exposed publicly.

## Deployment order

Before production deployment: back up the remote database, apply migration `0016_sermons.sql`,
build, deploy, add one verified sermon as a draft, preview every link and fact, then publish it. Do
not import the former demonstration sermon.
