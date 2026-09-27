# Administrator setup, portability and release checklist

Updated September 21, 2026.

## Current decision

Use **Sign in with Google** to verify identity, with application-owned administrator permissions and revocable SQL sessions. Cloudflare Access, password hashing, password setup and recovery endpoints are retired. No public registration exists.

Approved initial Administrator: `mortalerror@gmail.com`. Only an existing approved, active account can sign in. The first successful login links its verified Google identity; subsequent logins use Google's stable account ID, not just an email string. Automatic first linking is restricted to Google-authoritative Gmail or matching Google Workspace addresses. Other email domains need a separately reviewed identity-provisioning process.

Google Cloud project `epiphany-website-507618` was created on September 4, 2026 with billing left disabled. Its Google Auth Platform app is **Anglican Church of the Epiphany**, External/Testing, with `mortalerror@gmail.com` as the sole test user. Web client **Epiphany Website Local** allows only the documented loopback callbacks. Credentials are installed in ignored local configuration files. A real browser sign-in completed successfully against the Node/SQLite runtime on September 4, linking the approved administrator and creating a revocable app session. Public visitors do not need an account.

This avoids running an expensive password hash in the Worker. It does not prove that every request fits Workers Free's CPU budget. Production authentication and SSR usage still need measurement before release. No paid service, billing activation, remote migration or deployment is part of this change.

## 1. Create the Google login client

Use the owner's Google account in [Google Cloud Console](https://console.cloud.google.com/). Google sign-in needs a project and OAuth client; it does not require hosting the website on Google, Firebase, a service account, Gmail API or a paid Identity Platform subscription. Do not start a billing trial or attach a billing account for this setup.

1. Create a project, for example **Epiphany Website**. Keep its ownership and recovery access under the church's control.
2. Open **Google Auth Platform** and complete its initial configuration. Set the app name, an owner-approved support email and developer contact email.
3. Choose an **External** audience, since the approved account is Gmail. Keep it in Testing during setup. Add `mortalerror@gmail.com` under test users if that option is shown; the application's own allowlist remains the access control.
4. Request only basic identity: `openid` and email (`userinfo.email` in the console). No Gmail, Drive, Calendar or offline-access permissions are needed.
5. Under **Clients**, create an OAuth client with application type **Web application**. Register these exact **Authorized redirect URIs**:

   - `http://127.0.0.1:8080/api/admin/auth/google-callback`
   - `http://127.0.0.1:8787/api/admin/auth/google-callback`

   No authorized JavaScript origin is needed for this server-side redirect flow. Do not use a wildcard. `localhost` and `127.0.0.1` are different addresses.

6. Save the client ID and secret privately when created. Google may show the secret only once. Do not paste secrets, downloaded credential JSON, passwords or recovery codes into chat or source control.
7. Before production, add the exact canonical HTTPS callback on the real website, supply accurate branding/homepage/privacy information and review Google's audience/publishing requirements. Do not invent the production domain or publish the OAuth app prematurely.

Setup references: [Google's web-server OAuth guide](https://developers.google.com/identity/protocols/oauth2/web-server), [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect), [Google sign-in codelab](https://codelabs.developers.google.com/codelabs/sign-in-with-google-button).

## 2. Local viewing and configuration

Use Node 24 (tested with 24.14.1). Make an ignored `.env.local` based on `.env.example` and fill in the real values privately:

```dotenv
SQLITE_PATH=.data/app.sqlite
AUTH_ORIGIN=http://127.0.0.1:8080
GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_WEB_CLIENT_SECRET
```

These values are server-side. Never prefix credentials with `VITE_`, place them in public assets or commit them. Restart the server after changing them.

```text
npm install
npm run db:setup:node
npm run dev
```

Visit [local administration](http://127.0.0.1:8080/admin) and choose **Sign in with Google**. Enter Google credentials only on Google's own site. If Google blocks an embedded browser, open the local website in a regular browser instead; do not work around Google's browser protections.

The database is `.data/app.sqlite`. Six ministry records are development content, not an approved production import. The repeatable seed never reactivates or elevates an existing account. Administrators can approve additional Google accounts and manage roles from **Admin → Team**; there is still no public registration.

## 3. Security behavior

- Standard authorization-code flow through `openid-client`, with PKCE S256, random state and nonce. Each flow expires after ten minutes and is bound to a separate HttpOnly browser cookie, the configured origin and the OAuth client ID. Its state is claimed atomically, once.
- Google ID-token signatures, issuer, audience, expiry, nonce, issue time and verified email are checked server-side. A submitted email, bearer token or Cloudflare identity header never grants access.
- No Google access, refresh or ID tokens are persisted. Short-lived PKCE verifiers/nonces live only in the pending-flow table. Exports exclude this table.
- Sessions use 256-bit random tokens; the database stores only SHA-256 digests. HTTPS cookies have `__Host-`, Secure, HttpOnly, SameSite=Lax, Path=/ and no Domain. Sessions expire after eight hours.
- Every protected request checks active status, current role, session expiry and `auth_version`. Logout revokes the current app session, not the user's Google session.
- To revoke an administrator, disable the row, increment `auth_version` and delete its sessions. Do not simply clear `google_subject`: reassignment requires an audited owner identity check. Google password changes or account suspension do not automatically terminate an existing app session; Cross-Account Protection is not implemented.
- Enable Google's two-step verification or passkeys on administrator Google accounts. The app does not independently enforce Google MFA.
- Exact HTTPS `AUTH_ORIGIN` is mandatory outside loopback development. Configure the actual public origin behind a reverse proxy; do not trust arbitrary forwarded hosts.
- Sign-in initiation/logout require same-origin POST, JSON and the custom header. Callback is GET with single-use browser-bound state. Auth bodies are limited to 4 KiB; callback URLs to 12 KiB; content bodies to 64 KiB.
- One persisted bucket allows 100 sign-in starts per 15 minutes. Pending states are pruned as new flows start. This bounds growth but an attacker can temporarily exhaust sign-in availability; layered abuse protection is a release review item.
- Admin pages/APIs and redirects are private, no-store, noindex, no-referrer and frame-denied. Provider errors, credentials and SQL details are not reflected. Configure host/proxy logging to omit sensitive callback queries.
- Identity linking, sessions and audit entries are transactional. Content writes retain the same role checks, conflict detection and auditing.

Google identity verification reference: [Verify Google ID tokens](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).

## 4. Content editor and remaining modules

| Role          | Implemented capabilities                                            |
| ------------- | ------------------------------------------------------------------- |
| Editor        | View content and create/edit drafts                                 |
| Publisher     | Also publish, schedule, cancel events and archive                   |
| Administrator | Publisher capabilities, team/newsletter management and audit review |

Only administrators can open the Team panel. Adding a member pre-approves an exact email address;
the account is linked to its verified Google identity on first sign-in. Administrators can change
roles or disable access. Disabling an account invalidates its existing sessions, and the interface
prevents self-demotion and removal of the final active administrator. Every change is audited.

Events and ministries support explicit save, escaped-text preview, validation, revisions and conflicts. Slugs are generated from names/titles, duplicates receive numeric suffixes, and published URLs remain locked until redirect tools exist. Dates use explicit offsets and UTC storage.

JPG, PNG and WebP images can be uploaded directly. The browser resizes and converts them to WebP before submission; the server verifies the file signature and enforces a 1.25 MB limit. The image is stored transactionally in SQLite/D1, receives an immutable `/media/{id}` URL, and is also used for social sharing. PDFs still require a static-asset deployment. Site settings, permanent ministry detail pages, and database-backed sermon publishing are implemented locally. Standalone leader profiles and additional protected public forms remain later work; SEO improvement is ongoing.

## 5. Local Cloudflare preview

Node SQLite and local D1 are separate databases. Use ignored `.dev.vars` based on `.dev.vars.example`, with the same Google web client and `AUTH_ORIGIN="http://127.0.0.1:8787"`. No secret belongs in `wrangler.toml` or a generated build file. The preview launcher passes the ignored file to Wrangler by its absolute local path and reuses the project-level local D1 state; it does not copy the credentials into generated output.

Stop the development server before building, because build pipelines share generated intermediate files.

```text
npm run build
npm run db:migrate:local
npm run db:seed:local
npm run db:admin:local
npm run preview:worker -- --port 8787
```

Local migrations 0001–0011 are applied. Migration 0004 preserves content/accounts/audit history,
removes old password hashes, invalidates sessions and password recovery links, and creates Google
identity/state storage. Migration 0005 adds portable image storage. Migration 0011 adds the durable
event-newsletter outbox and workflow controls. Private pre-change Node and local-D1 exports are
retained under ignored `.data/`. Those legacy backups can contain credential material; protect them.
Do not restore them into the active database casually. Never run the development seed remotely.

## 6. Moving away from Cloudflare

Content, roles and sessions use an isolated SQLite-dialect database contract. D1 and Node/SQLite adapters implement it. Google sign-in has no Cloudflare identity dependency; it remains dependent on Google as the chosen identity provider.

```text
npm run build
npm run build:node
npm run start:node
```

Cloudflare output is `.output`; Node output is `.output-node`. A new Node host needs Node 24, persistent writable storage, HTTPS, backups, process supervision and the correct `SQLITE_PATH`. Ephemeral serverless disks are unsuitable. PostgreSQL/MySQL requires additional schema/adapter work.

Cutover:

1. Pause content/account/authentication writes and back up the source. Keep the empty destination stopped during restore.
2. Export privately. Exports include Google identity IDs, approved emails, roles, content and audit data. They are not encrypted automatically and must not be published.
3. Import into an empty initialized database. Uploaded images move with the versioned portable export. Sessions, OAuth states, password hashes, recovery tokens and throttles do not migrate. Legacy v3/v4 exports are accepted but old passwords are discarded.
4. Move assets and server configuration separately. Retain the same OAuth client if appropriate; register the new HTTPS callback with Google and update `AUTH_ORIGIN`.
5. Verify row counts, slugs, Google login, permissions and public HTML before DNS cutover. Everyone signs in again.
6. Retain the old host and backup for rollback, avoid writes on both hosts, then resume editing after verification.

```text
node scripts/export-d1.ts --file .data/private-d1-export.json
node scripts/database.ts import --database .data/migrated.sqlite --file .data/private-d1-export.json
node scripts/database.ts export --database .data/app.sqlite --file .data/private-node-export.json
node scripts/database.ts import --database .data/restored.sqlite --file .data/private-node-export.json
```

D1 export is local unless explicitly given `--remote`; remote operations require owner approval. Exports refuse overwriting existing files and imports refuse merging into populated databases. Enforce filesystem access controls and encryption separately, especially on Windows.

## 7. Verification and production gates

```text
npm run test:admin
npx tsc --noEmit
npm run build:node
npm run build
```

Automated tests use isolated databases and locally signed, disposable Google fixtures. They exercise real token verification code and are complemented by successful real Google end-to-end logins on both the Node and local Cloudflare runtimes.

Local verification through September 5, 2026: 39 automated tests passed; TypeScript and focused lint passed; Node and Cloudflare production builds passed. Real Google sign-in succeeded on both the Node runtime and local Cloudflare runtime. The Cloudflare rehearsal linked the approved Administrator, created an active SQL session and wrote the expected link/login audit records. A real local D1 upload rehearsal generated the slug, wrote and served the image with immutable caching, and removed its temporary test records. A signed-provider fixture completed login, publish/archive, replay rejection, logout and auditing against actual local D1. The updated portable export restored accounts, content and image bytes into Node SQLite without passwords, sessions or recovery links. Browser checks confirmed the Google button and clear unconfigured notice. Both local runtimes return private admin pages and refuse sign-in without Google credentials. Browser assets contain no server authentication configuration/SQL; Cloudflare output contains no Node SQLite adapter. Dependency installation still reports 11 existing advisories (10 high, 1 low), requiring a separate compatibility-reviewed hardening pass before production.

The local Cloudflare fixture uses a deliberately non-production D1 ID. Never deploy it or bind it to the church database:

```text
npx wrangler d1 migrations apply epiphany-auth-test-only --local --config tests/fixtures/wrangler.auth-test.toml
npx wrangler dev --config tests/fixtures/wrangler.auth-test.toml --port 8791 --local
```

Request `http://127.0.0.1:8791` once to test a signed Google fixture, single-use callback, session, publish/archive, logout and audit in actual local D1.

Before production:

- Verify the actual canonical origin, alternate-host behavior, OAuth publishing settings, privacy information and administrator Google-account security.
- Recheck Workers Free/D1 plan status and limits; measure real production CPU, including cold/warm login callbacks and SSR, in an explicitly approved isolated deployment. Google sign-in removes scrypt, not all processing costs.
- Back up and approve remote migrations, account provisioning and verified content import. Empty production tables otherwise produce empty listings.
- Rehearse authorization, draft privacy, publishing, scheduling, conflicts, logout, account revocation and restore.
- Address dependency advisories and finish public content, SEO/accessibility/performance checks in the main plan.
- Obtain explicit deployment approval and record Worker/database rollback steps. No billing upgrade is authorized.

Manual schema rollback is destructive. Roll back 0005 before 0004, 0003 and 0002 only with approval and a verified backup; 0005 rollback deletes uploaded images. Reconcile migration tracking through a reviewed recovery procedure. Prefer forward repairs where practical.

Limits references: [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/).
