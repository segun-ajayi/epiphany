# Zero-Cost Backend and Content Management Plan

> Giving-page design, donation operations, receipt requests, and related administrator controls are
> governed by [Giving page and donation operations — source of truth](giving-page-plan.md).

**Project:** Anglican Church of the Epiphany website
**Status:** In progress — authentication and first content modules implemented locally
**Prepared:** September 1, 2026
**Implementation state:** Phase 1 began September 2, 2026. The existing `epiphany-db` D1 database is bound to the Worker. Events and ministries have database-backed public reads and a protected administrative editor. Google sign-in with app-owned sessions and a Node/SQLite hosting path replaces the earlier Access/password designs. Google project setup and real sign-in rehearsals on both local runtimes are complete; Cloudflare Free CPU validation and production deployment remain pending.

### Current implementation checkpoint — September 5, 2026

- The home-page newsletter is connected to the database with explicit consent, duplicate-safe
  signup, a bot-trap field, request-size limits, and a clear success state.
- Newsletter details are restricted to Administrators, with active/unsubscribed management and CSV
  export. This release records consent but deliberately does not send campaigns until an approved
  no-cost delivery service and unsubscribe-link flow are chosen.
- Subscribers and consent timestamps are included in the portable database export, so a future move
  away from Cloudflare will not strand the mailing list.

- The owner approved Google sign-in after evaluating the CPU cost of app-owned passwords. Google verifies identity; roles, sessions and content remain application-owned. No Zero Trust account or billing activation is required.
- The existing remote D1 database still has only the earlier foundation migration and empty event/ministry tables. No production account or content import was performed.
- Migrations 0001–0005, approved initial Administrator `mortalerror@gmail.com`, and six development ministry records are available locally. Google project `epiphany-website-507618`, its External/Testing app, sole test user and local web client are configured without billing; real sign-ins succeeded on both the Node and local Cloudflare runtimes on September 4.
- `/admin` now uses Google authorization-code sign-in, PKCE, nonce, single-use browser-bound state, verified ID tokens, an approved-account allowlist and revocable SQL sessions. Password login/setup/recovery are retired.
- Events and ministries support drafts, publication scheduling, publishing, archiving and optimistic concurrency. Slugs are generated from names/titles, disambiguated automatically and locked after publication.
- Public reads use the database in both development and production; missing/empty data never restores hardcoded content. Existing static image mappings remain for compatibility, while new images can be optimized and uploaded into portable database storage.
- Application logic uses a shared SQLite-dialect contract with D1 and ordinary Node/SQLite adapters. Separate builds and owner-only export/import tooling preserve Google account IDs, roles and content; sessions and temporary authentication secrets do not migrate.
- **Free-plan release gate:** Google sign-in removes the expensive scrypt operation. Local Google login is verified on both runtime targets, but production CPU compatibility remains unverified. Measure cold/warm callbacks and SSR against Workers Free before release; no deployment or billing change is authorized.
- Automated tests cover authentication, permissions, transaction failures, concurrency and portable restore. Browser checks and local D1 rehearsals complement these tests. See [Administrator setup, portability and release checklist](admin-setup.md).
- No paid service or remote deployment was enabled. Portable site settings, permanent ministry pages, and database-backed sermon publishing are now implemented locally. Standalone leader profiles, additional public forms, and later SEO improvements remain future work.

## 1. Purpose

The website currently stores church information, ministries, events, sermons, leaders, service times, gallery entries, and other content in source-controlled TypeScript data. Updating the website therefore requires editing code, rebuilding the application, and deploying it.

This plan replaces that hardcoded content layer with a small, secure administration system while preserving the existing public website and its server-rendered SEO benefits.

The backend must:

- Allow authorized church staff to manage content without editing code.
- Keep public content server-rendered and crawlable.
- Support drafts, previews, publishing, scheduling, and archiving.
- Generate metadata, structured data, and sitemaps from published records.
- Complete contact, newsletter, and event-registration workflows.
- Remain on Cloudflare's free plans and produce no Cloudflare bill.
- Fail safely at free-tier limits rather than automatically creating charges.

## 2. Non-negotiable constraints

1. **Cloudflare cost must remain $0.**
2. No paid CMS, database, authentication provider, image service, email service, or monitoring subscription is required for the initial system.
3. Usage-billed Cloudflare products will not be enabled unless the site owner explicitly revises this constraint.
4. R2, Cloudflare Images, Stream, Durable Objects, Queues, and other potentially billable services are excluded from the initial architecture.
5. Existing public URLs should remain stable wherever possible.
6. Draft and administrative content must never be indexable.
7. Existing user changes and unrelated repository content must be preserved during implementation.
8. Authentication and content must be portable to another host; isolate provider adapters and maintain a tested export/restore path.

## 3. Decision summary

The initial hosting target remains Cloudflare Free, with a separate Node/SQLite deployment path. Authentication's production CPU fit is a release gate, not a confirmed free-plan capability:

| Requirement                       | Service                                        | Reason                                                                                  |
| --------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| Application and API execution     | Workers Free                                   | Already compatible with the deployed TanStack Start application                         |
| Relational content storage        | D1 Free                                        | Sufficient for structured church content and form submissions                           |
| Administrator authentication      | Google identity and app-owned SQL sessions     | Host-portable identity; no Access tenant; free-plan CPU fit still requires verification |
| Bot protection                    | Cloudflare Turnstile Free                      | Protects public forms without a paid CAPTCHA service                                    |
| Images, PDFs, CSS, and JavaScript | Workers Static Assets                          | Free storage and unlimited static-asset requests                                        |
| Public page delivery              | Existing Cloudflare CDN and short edge caching | Reduces Worker and D1 usage                                                             |

### Free-plan capacity as of September 1, 2026

- Workers Free: 100,000 dynamic requests per day and 10 ms CPU time per invocation.
- D1 Free: 5 million rows read per day, 100,000 rows written per day, 500 MB maximum per database, and 5 GB total account storage.
- Workers Static Assets: free and unlimited asset requests, with up to 20,000 asset files per Worker version and 25 MiB per file.
- Turnstile Free: free widgets with unlimited verification requests within the published free-plan limits.

Request/storage allowances may suit a small church site, but Google token verification and SSR must be measured against the CPU limit. Cloudflare may change limits; recheck before release and during annual maintenance.

### Services explicitly excluded

- **R2:** It has a free allowance but is a usage-billed subscription and can produce charges above that allowance.
- **Cloudflare Images and Stream:** Not required and may introduce metered charges.
- **Paid Workers:** The account should remain on Workers Free.
- **Third-party hosted CMS:** Avoids per-seat fees, platform lock-in, and a second operational system.
- **Paid transactional email:** Form submissions will initially be managed through the admin inbox.

## 4. Proposed architecture

```text
Public visitor
      |
      +-- Static file request ----------------> Cloudflare Static Assets
      |                                          images, CSS, JS, PDFs
      |
      +-- Public page request ----------------> TanStack Start Worker
                                                 |
                                                 +--> D1 published content
                                                 +--> HTML metadata/schema

Administrator
      |
      +-- /admin ------------------------------> Google sign-in
                                                 |
                                                 +--> Revocable SQL session
                                                       |
                                                       +--> Admin UI/API
                                                             |
                                                             +--> D1 or SQLite
                                                             +--> Audit log

Public form
      |
      +-- Contact/newsletter/registration ----> Turnstile verification
                                                 |
                                                 +--> Validation and abuse checks
                                                       |
                                                       +--> D1 admin inbox
```

Static assets should bypass Worker execution whenever possible. Only SSR pages, admin requests, and form submissions should invoke the Worker.

## 5. Authentication and authorization

### Authentication

Google confirms administrator identity using a standard OpenID Connect authorization-code flow with PKCE, state and nonce. The application verifies signed tokens, links only approved active accounts and owns all permissions and sessions. Production cookies are Secure, HttpOnly, host-only and SameSite=Lax. Every private request checks current account status and role.

There is no public signup or password endpoint. The owner provisions approved accounts; first linking requires a verified Google-authoritative Gmail or matching Workspace email. Later sign-ins use the stable Google account ID. Google handles password/account recovery; administrator reassignment requires an audited owner check. Google two-step verification is recommended but not enforced by this app. Google account changes do not automatically revoke app sessions; owner revocation remains necessary.

Persistent sign-in-start throttles, request-size limits, exact-origin checks, private caching and audit records are implemented. Google tokens are not persisted. The implementation has no Cloudflare identity dependency, but does depend on Google as its identity provider. Credentials remain server-side; no paid authentication subscription is introduced.

**Cost constraint:** removing scrypt is not a production performance guarantee. Measure Google token verification and SSR before release. If limits are exceeded, obtain an owner decision on a free execution arrangement; no paid fallback is authorized.

### Application roles

Authorized identities will also exist in an `admin_users` table.

| Role          | Capabilities                                                                 |
| ------------- | ---------------------------------------------------------------------------- |
| Editor        | Create and edit drafts; view form submissions                                |
| Publisher     | Editor capabilities plus publish, schedule, archive, and redirect management |
| Administrator | Publisher capabilities plus user access, settings, exports, and audit review |

App-owned sessions protect entry; database roles determine what an authenticated person may do. The table above is the target roadmap: the current increment implements content permissions and audit review, not submissions, redirects, settings or user management.

### Administrative security requirements

- State-changing routes accept only appropriate POST, PUT, PATCH, or DELETE requests.
- Same-origin and CSRF checks are required for mutations.
- All SQL uses bound parameters.
- Content is validated on the server, even when client validation succeeds.
- Admin, preview, and API responses use `noindex` where appropriate.
- Security events and mutations are recorded in an audit log.
- No Cloudflare API tokens are exposed to the browser.

## 6. Content model

Every publishable record should use stable IDs and slugs. Common fields include:

- `id`
- `slug`
- `status`: `draft`, `published`, or `archived`
- `seo_title`
- `seo_description`
- `social_image_path`
- `published_at`
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`

Slugs are generated from the name/title and must be unique per content type. Numeric suffixes resolve duplicate names. Published slugs remain stable; a future manual change must create a redirect instead of silently breaking the old URL.

### 6.1 Events

Key fields:

- Title, generated slug, summary, and full description
- Category
- Start and end time
- IANA timezone, normally `America/Chicago`
- Venue name and structured address
- Registration status and capacity, when applicable
- Contact details
- Uploaded image and alt text
- Draft, published, cancelled, and archived state
- SEO and social metadata

Event times should be stored unambiguously and formatted explicitly for Houston. Date-only JavaScript parsing must not be used because it can display the previous day in US time zones.

### 6.2 Ministries

Key fields:

- Name and generated slug
- Short summary and full description
- Meeting schedule
- Leader name and contact email
- Audience or age range
- Uploaded image and alt text
- Display order
- Published state and SEO metadata

Each ministry will have a permanent public URL. Ministry details should not exist only inside a client-side modal.

### 6.3 Sermons

Key fields:

- Title and slug
- Sermon date
- Speaker or leader reference
- Scripture reference
- Series reference
- Topic
- Summary and full transcript or notes
- YouTube video ID
- Optional audio URL
- Optional static notes-PDF path
- Static thumbnail path and alt text
- Publication state and SEO metadata

Separate tables should support sermon series and reusable speakers. Published sermon pages will generate `VideoObject` structured data when complete and valid.

### 6.4 Leaders and staff

Key fields:

- Name and slug
- Role/title
- Biography
- Verified email address
- Static photograph path and alt text
- Approved social profiles
- Display order
- Active/inactive state

Example addresses and unverified social profiles must not be migrated.

### 6.5 Service times

Key fields:

- Day of week
- Start time
- Service name and description
- Location
- Display order
- Effective start and optional end date
- Special or holiday status

Service times should drive the homepage, contact page, structured data, and Google Business Profile update checklist from one canonical source.

### 6.6 Gallery and media metadata

Binary media will remain in static assets. D1 stores only metadata:

- Static asset path
- Caption and descriptive alt text
- Width and height
- Credit or photographer
- Category
- Capture date
- Display order
- Publication state

### 6.7 Stories and testimonials

Key fields:

- Display name
- Quote or story
- Optional photograph path
- Written publication consent record
- Display order
- Publication state

Nothing should be published without recorded permission.

### 6.8 Church settings

One canonical settings area should contain:

- Exact real-world church name
- Denomination/diocese wording
- Address, phone, and domain email
- Geographic coordinates
- Real social profile URLs
- Default SEO title and description
- Default social image
- Donation instructions
- Footer and contact information

This prevents inconsistent NAP information across pages.

### 6.9 Form submissions

Supported types:

- Contact message
- Prayer request, if approved
- Newsletter interest
- Event registration

Common fields:

- Type and status
- Name, email, and optional phone
- Subject and message
- Related event ID
- Consent timestamp
- Created and reviewed timestamps
- Reviewer identity

Raw IP addresses should not be retained as content. Sensitive submissions require a documented retention period and deletion workflow.

### 6.10 Redirects

Redirect records should contain:

- Previous path
- Destination path
- HTTP status, normally 301
- Reason
- Creation date and creator

Redirect targets must be restricted to safe local paths unless an administrator explicitly approves an external destination.

### 6.11 Audit log

The audit log should record:

- Authenticated administrator
- Action and content type
- Record ID
- Timestamp
- High-level change summary

The initial release does not require storing a full copy of every historical revision.

## 7. Administration experience

The `/admin` area should provide:

1. Dashboard with drafts, scheduled items, upcoming events, recent submissions, and content warnings.
2. Event management.
3. Ministry management.
4. Sermon and sermon-series management.
5. Leader and staff management.
6. Service-time and church-setting management.
7. Gallery metadata and static-asset selection.
8. Stories/testimonials and consent status.
9. Form-submission inbox.
10. Redirect management.
11. User-role and audit-log management for administrators.

### Publishing workflow

```text
Draft -> Preview -> Publish now or Schedule -> Published -> Archive
```

Rules:

- Editors may save drafts but cannot publish.
- Publishers and administrators may publish or schedule.
- Preview routes are session-protected and `noindex`.
- Explicit Save is preferred to frequent autosave to minimize unnecessary D1 writes.
- Required fields vary by content type and must be complete before publication.
- Archiving preserves the record and its audit history.

## 8. Media strategy under the zero-cost constraint

### Implemented approach

- The admin form accepts JPG, PNG and WebP files instead of storage paths.
- The browser resizes images and converts them to WebP before upload, targeting at most 1800 × 1350 and 1.25 MB.
- The server verifies raster signatures, rejects SVG and oversized files, and writes an image in the same transaction as its content/audit record.
- Images use stable, immutable `/media/{id}` URLs with explicit content types, ETags and long-lived browser/CDN caching headers.
- Replacing or removing an image deletes the old database asset only when no content record references it.
- Videos remain on YouTube and are stored as video IDs. PDFs remain static assets for now.
- Versioned portable exports include image bytes so a Node/SQLite move does not require Cloudflare storage migration tooling.

### Zero-cost limits and consequence

D1 currently limits a BLOB/row to 2 MB and a Free database to 500 MB, so the application cap is deliberately lower. Image delivery consumes Worker/D1 requests until cached and must be measured with the other Free-plan release gates. If the media library or traffic outgrows this small-site design, move images to static deployment assets or another explicitly approved store. R2 is not enabled; any storage service with usage-based billing still requires separate owner approval.

## 9. Public rendering and SEO integration

Published D1 records will be loaded during server rendering. Search engines and non-JavaScript clients must receive complete page content in the initial HTML response.

The backend will drive:

- Absolute canonical URLs
- Page-specific titles and meta descriptions
- Absolute Open Graph and Twitter metadata
- `Church`/`Organization` and `WebSite` structured data
- `BreadcrumbList` structured data on detail pages
- `Event` structured data on valid event pages
- `VideoObject` structured data on valid sermon pages
- An absolute XML sitemap containing all published canonical URLs
- Accurate `lastmod` values from meaningful content changes
- Redirects for changed or retired slugs

Only published records appear in navigation, listings, sitemaps, structured data, or related-content widgets.

Drafts, previews, admin pages, internal APIs, and private submissions must not be indexable.

## 10. Public forms and abuse protection

Contact, newsletter, and event-registration forms should use:

- Same-origin POST endpoints
- Cloudflare Turnstile Free
- Server-side schema validation
- Honeypot and minimum-completion-time checks
- Request size limits
- Duplicate-submission controls
- Neutral success responses that do not leak internal details
- Privacy notice and explicit consent where necessary

Submissions will appear in the admin inbox. The first release does not promise email delivery because no paid or externally hosted email service is included.

## 11. Performance and free-tier controls

### Query controls

- Index slugs, publication status, event dates, sermon dates, and foreign keys.
- Avoid full-table scans and N+1 query patterns.
- Select only fields needed by each route.
- Paginate admin lists and growing public archives.
- Batch related D1 operations where appropriate.

### Request controls

- Static assets bypass Worker execution.
- Public content uses short edge-cache lifetimes where safe.
- Admin and form endpoints are never publicly cached.
- Static asset filenames are content-hashed for long-lived caching.
- Cache headers distinguish public, private, and draft content.

### Fail-safe behavior

- The account remains on Workers Free.
- No automatic upgrade or paid product activation is part of the design.
- If a free daily dynamic limit is reached, Cloudflare should reject excess dynamic requests rather than charge for overage.
- Static assets continue to be served independently where Cloudflare routing permits.
- Public error pages must not expose stack traces, secrets, or submission data.
- Usage should be reviewed monthly and before major public campaigns.

## 12. Data migration strategy

The existing TypeScript content must remain available until database-backed pages reach feature parity.

Migration sequence:

1. Create and review an authoritative content truth sheet.
2. Identify valid records and discard placeholders, example addresses, dummy videos, and unverified claims.
3. Create D1 migrations and a repeatable seed/import process.
4. Import verified church settings, service times, ministries, leaders, sermons, and media metadata.
5. Compare database-backed preview pages with the current site.
6. Switch one content area at a time to D1.
7. Verify URLs, metadata, schema, sitemap entries, and redirects.
8. Remove hardcoded content only after production verification and an approved rollback point.

The migration must not invent missing facts. Incomplete records remain drafts until church leadership supplies and approves the information.

### Hosting migration

The D1 binding lives behind a provider adapter; Node 24 can run the same content/authentication services against a persistent SQLite file. Maintain numbered SQLite migrations and versioned portable exports of approved accounts/Google IDs, content, uploaded images and audit data. Never export active sessions, OAuth states, password hashes or recovery tokens.

Before cutover, stop writes, create a protected backup, import into an empty stopped destination, verify content IDs/slugs/images/Google login and public HTML, register the new Google callback, configure HTTPS/origin/DNS and retain a rollback point. Static assets and environment configuration move separately. PostgreSQL/MySQL would require additional dialect/schema work; the implemented portability target is Node with SQLite. See the exact commands and backup cautions in [admin-setup.md](admin-setup.md).

## 13. Implementation phases

### Phase 0 — Decisions and verified content

- Confirm the exact church name, NAP details, history, service times, leadership, social profiles, and claims.
- Identify initial administrators and roles.
- Approve form-retention and consent rules.
- Decide which existing images and documents may be published.

**Exit criterion:** Approved truth sheet and administrator list.

### Phase 1 — Database foundation

- Define D1 schema and indexes.
- Create forward and rollback migrations.
- Create local seed data from verified records.
- Establish typed repository/service boundaries.

**Exit criterion:** Repeatable local database creation and migration tests.

### Phase 2 — Authentication and admin shell

- Implement Google identity verification, secure app-owned sessions and owner-controlled account provisioning.
- Verify both D1 and Node/SQLite runtime paths and measure the Workers Free CPU budget.
- Implement D1-backed roles and audit logging.
- Build the accessible admin navigation and dashboard shell.

**Exit criterion:** Unauthorized users are blocked and roles are enforced server-side.

### Phase 3 — Content modules

- Implement settings and service times.
- Implement ministries and leaders.
- Implement events.
- Completed locally: implement sermons and series with external media links and search metadata.
- Implement gallery metadata and stories.
- Implement preview, scheduling, publishing, and archiving.

**Exit criterion:** Authorized staff can manage each content type without editing source files.

### Phase 4 — Public integration and migration

- Replace hardcoded public reads one module at a time.
- Completed locally: add permanent ministry pages with contact, schedule, newcomer, and SEO fields.
- Correct date/time handling.
- Migrate verified content.
- Preserve URLs and create redirects where needed.

**Exit criterion:** Public pages use D1 and pass visual, functional, and SEO parity checks.

### Phase 5 — Forms and SEO automation

- Implement Turnstile-protected forms and admin inbox.
- Generate sitemap, metadata, canonicals, and structured data from D1.
- Add privacy and retention controls.

**Exit criterion:** Forms work end-to-end and published content is discoverable with valid SEO output.

### Phase 6 — Hardening and production release

- Complete accessibility, security, performance, and failure-mode testing.
- Run data export and restore drills.
- Verify Cloudflare free-plan status and usage.
- Deploy with a documented rollback procedure.

**Exit criterion:** All acceptance criteria below are satisfied.

## 14. Testing strategy

### Automated tests

- Schema migration and rollback tests
- Repository query tests
- Server-side validation tests
- Role and authorization tests
- Publication-state and scheduling tests
- Slug uniqueness and redirect tests
- Metadata, sitemap, and structured-data tests
- Date/time tests using `America/Chicago`
- Form abuse and Turnstile failure tests
- Critical public and admin end-to-end journeys

### Manual verification

- Keyboard-only admin and public navigation
- Screen-reader labels and announcements
- Mobile and desktop layouts
- Draft-preview isolation
- Search-engine rendered HTML
- Broken-link and missing-asset scans
- Real event, ministry, and sermon publishing rehearsal
- Database export and restore rehearsal

## 15. Acceptance criteria

### Cost

- Cloudflare account remains on Workers Free.
- No R2, Images, Stream, paid Workers, or paid third-party service is required.
- Static assets bypass dynamic Worker execution where possible.
- The owner receives documentation showing where to review usage.

### Content management

- Authorized staff can create, edit, preview, publish, schedule, archive, and reorder supported content.
- Invalid and incomplete content cannot be published.
- No public `undefined`, example contact, placeholder, or dummy media values remain.
- Changes are attributable through the audit log.

### Public website

- Published content is server-rendered.
- Existing approved URLs continue working or redirect permanently.
- Event, ministry, sermon, and leader pages have complete metadata.
- Sitemap URLs are absolute and include dynamic published content.
- Draft and private content cannot be indexed.

### Forms

- Contact, newsletter, and event registration persist valid submissions.
- Spam and invalid requests are rejected.
- Administrators can review and update submission status.
- Consent and retention rules are visible and enforceable.

### Security and recovery

- App-owned sessions and database roles protect every admin request and mutation.
- Google signature/audience/issuer/nonce checks, browser-bound single-use state, approved-account linking, session expiry/revocation and persistent throttles are tested.
- Server-side validation, CSRF protection, bound SQL parameters, and output sanitization are implemented.
- A documented database export and restore process succeeds.
- No secrets, access tokens, or personal submissions are exposed to the client or logs.

## 16. Operations and recovery

- Use D1 migrations for every schema change.
- Keep migrations and seed/import tooling in version control.
- Use D1 Time Travel within the Free plan's available recovery window.
- Produce a manual encrypted database export before migrations and at least monthly.
- Review administrator access quarterly and remove former staff immediately.
- Review form submissions and delete expired personal data according to the approved retention period.
- Review Cloudflare usage monthly and before campaigns likely to produce unusual traffic.
- Revalidate free-plan limits annually because platform policies may change.

## 17. Known tradeoffs

1. New local media requires a repository deployment in the initial version.
2. The admin inbox will not send email notifications unless a separately approved free integration is added.
3. Free-plan traffic limits can cause temporary dynamic failures during an unusually large traffic spike.
4. The free Cloudflare plan does not provide a paid SLA.
5. A custom admin system requires ongoing security and dependency maintenance even though it has no hosting fee.

These tradeoffs are accepted in exchange for predictable zero-cost operation and ownership of the content model.

## 18. Decisions required before implementation

The initial Administrator has been approved, and implementation was separately authorized. The following decisions remain release gates for the relevant modules:

- Exact administrator email addresses and roles
- Canonical church name, address, phone, domain email, and denomination wording
- Verified founding/history information
- Current leaders and approved biographies/contact details
- Current ministries, schedules, leaders, and contact addresses
- Service times and holiday-service workflow
- Form data-retention period and prayer-request policy
- Approved social profiles and media rights
- Whether form email notifications are required in the initial release
- Deployment and database-export owner

## 19. Current official references

- Workers pricing: <https://developers.cloudflare.com/workers/platform/pricing/>
- Workers limits: <https://developers.cloudflare.com/workers/platform/limits/>
- D1 pricing: <https://developers.cloudflare.com/d1/platform/pricing/>
- D1 limits: <https://developers.cloudflare.com/d1/platform/limits/>
- Static asset billing: <https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/>
- Google OpenID Connect: <https://developers.google.com/identity/openid-connect/openid-connect>
- Google ID-token verification: <https://developers.google.com/identity/gsi/web/guides/verify-google-id-token>
- Google OAuth setup: <https://developers.google.com/identity/protocols/oauth2/web-server>
- Cloudflare native crypto: <https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/>
- Turnstile plans: <https://developers.cloudflare.com/turnstile/plans/>
- R2 pricing, for the documented exclusion: <https://developers.cloudflare.com/r2/pricing/>

---

The original document authorized planning only. The owner subsequently authorized coding and supplied the initial Administrator email. After replacing Access with app-owned passwords, the owner chose Google sign-in to avoid password-hashing CPU costs. Google project/client setup and real local sign-ins are complete; production CPU compatibility, approved content and explicit deployment approval remain release gates. No billing change is authorized.
