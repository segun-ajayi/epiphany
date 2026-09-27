# Giving page and donation operations — source of truth

**Project:** Anglican Church of the Epiphany website
**Status:** Local implementation in progress; production deployment not authorized
**Prepared:** September 21, 2026
**Applies to:** Public Give page, giving settings, receipt requests, administrator workflow, SEO,
accessibility, security, testing, and release

This document is the authoritative product and implementation plan for the website's giving
experience. If code, screenshots, tickets, or informal instructions conflict with this document,
update this document through an explicit owner-approved decision before implementing the conflict.

## 1. Objective

Create a clear and trustworthy giving experience that lets a visitor donate through church-owned
external payment methods, understand exactly where the money is going, request a receipt, and get
help when needed.

The website must remain outside the money flow. It may explain the process, link to an approved
provider, copy a payment identifier, display a verified QR code, and record a receipt request. It
must not collect or transmit card numbers, bank credentials, routing numbers, CVVs, payment-account
passwords, or authentication codes.

## 2. Non-negotiable constraints

1. **Cloudflare cost remains $0.** Do not enable a paid Cloudflare plan or usage-billed product for
   this feature.
2. Cloudflare and the website do not process or hold donated money.
3. The initial release uses church-approved external methods, currently Zelle and Cash App.
4. A visitor must be able to identify the expected recipient before leaving the website or sending
   money.
5. Payment destinations, recipient names, instructions, QR codes, and method availability must be
   controlled by an Administrator and audited.
6. The site must not claim recurring giving, automatic receipts, tax status, annual reports, or a
   specific charitable impact unless the corresponding capability or evidence exists.
7. The design and stored data must remain portable to the existing Node/SQLite deployment path.
8. Public pages remain server-rendered, crawlable, accessible, and useful without client-side
   JavaScript. Copy buttons and enhanced interactions may use JavaScript as progressive enhancement.
9. A receipt request is not proof that a donation was received. An authorized church user must
   reconcile it against the payment account before issuing a receipt.

External payment providers or banks may charge fees under their own terms. This is separate from
the requirement that the website itself create no Cloudflare bill.

## 3. Current-state review

The current `/give` page has a strong visual theme, a relevant hero image, impact cards, FAQ
accordions, a unique page title, a description, a canonical link, and inclusion in the sitemap.

The following issues are release blockers for the redesigned experience:

- Zelle and Cash App are plain headings rather than actionable giving methods.
- There are no copy controls, provider links, QR codes, recipient verification, instructions,
  designation guidance, or donation-support contact.
- The page metadata promises one-time and recurring online giving, although neither is implemented.
- The FAQ promises a receipt for every gift, but the page has no donor-identification or receipt
  workflow.
- The 501(c)(3), annual-report, and impact statements are not linked to supporting information.
- A 390-pixel mobile viewport has horizontal overflow. Long payment identifiers and grid sizing
  cause a horizontal scrollbar.
- The hero pushes the actionable giving information too far below the fold, especially on mobile.
- Social metadata is generic rather than giving-specific, and there is no giving-specific structured
  data.
- The route contains unused donation state and a large commented-out payment form.
- Giving content is hardcoded and requires a code deployment to change.

## 4. Approved initial experience

### 4.1 Page order

The initial page should use this order:

1. Compact giving hero.
2. Trust and recipient-verification statement.
3. Active giving-method cards.
4. Designation and memo instructions.
5. Optional receipt-request call to action.
6. Verified impact examples.
7. Giving FAQ and donation-support contact.

The giving methods should be visible at or near the initial viewport on common mobile and desktop
sizes. The Give page may use a shorter hero than content-led pages.

### 4.2 Trust statement

Before the payment cards, state that the website does not collect payment details and that the
donation is completed in the donor's bank or payment application. Display the church's verified
legal/public name and tell the donor to stop and contact the church if a different recipient appears.

Do not imply that copying an identifier or opening an external application completed a donation.

### 4.3 Giving-method card requirements

Each enabled method must show:

- Provider name.
- Verified payment identifier.
- Expected recipient display name.
- Short provider-specific instructions.
- A clear primary action.
- A copy action with an accessible success announcement.
- A church-approved QR code when available.
- A fallback explanation for visitors who cannot use the method.
- A visible statement that the transfer occurs outside the website.

#### Zelle

- Display the approved email address or phone number.
- Display the exact recipient name a donor should see in their banking application.
- Provide **Copy Zelle address**.
- Display only a QR code exported from the church's enrolled bank/Zelle account and verified by an
  Administrator. Do not generate a QR code by guessing a proprietary payment payload.
- Zelle does not become a website checkout flow; the donor completes the transfer in the bank app.

#### Cash App

- Display the approved Cashtag and expected recipient name.
- Provide **Open Cash App** using a provider-approved HTTPS link.
- Provide **Copy Cashtag**.
- Display a verified account QR code when supplied by the church.
- Open an external link in a way that preserves a clear return path to the website.

### 4.4 Designations and memos

Show a short, Administrator-managed list of valid designations and explain what to place in the
payment memo. Do not offer a designation that the treasurer cannot identify and account for.

The initial default should be **General Fund**. The owner must approve every additional designation.
If a payment method cannot reliably carry a memo, explain the fallback process.

### 4.5 Receipt request

After completing an external transfer, a donor may open **Request a donation receipt**. The form
should collect only what the church needs to locate the payment and prepare a receipt:

- Donor name.
- Donor email.
- Donation amount in US dollars.
- Payment method.
- Donation date.
- Designation, if used.
- Short transaction/reference value, if available.
- Optional note.
- Consent to use the submitted information to locate the donation and issue the receipt.

Do not ask for card numbers, bank-account numbers, routing numbers, passwords, authentication
codes, government identifiers, or payment screenshots in the initial release.

After submission, clearly say that the request was received but the donation must be verified
before a receipt is issued. Do not expose whether another donor or transaction exists.

### 4.6 Receipt and tax wording

Before release, the owner or treasurer must approve the exact legal name, tax-status wording,
receipt issuer, and receipt-delivery process. The current promise that every gift automatically
receives a receipt must not remain unless operations can fulfill it.

For a contribution of $250 or more, the IRS describes required content for a written
acknowledgment, including the organization's name, the amount of a cash contribution, and an
appropriate goods-or-services statement. Reference:
[IRS — Charitable contributions: Written acknowledgments](https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-contributions-written-acknowledgments).

The website and admin workflow help collect and reconcile information; they are not tax or legal
advice. The church remains responsible for approved receipt language and record retention.

## 5. Content that must be verified before implementation

The following values are deliberately not decided by this plan:

- Legal organization name for receipts.
- Approved public church name.
- Exact 501(c)(3) or church tax-status wording.
- Whether an EIN should appear publicly or only on receipts.
- Zelle identifier and recipient display name.
- Cash App Cashtag, recipient display name, account type, and approved external URL.
- Verified QR images for each method.
- Donation-support email and phone number.
- Receipt-request service target and expected turnaround time.
- Approved designation list.
- Evidence and wording for each impact example.
- Annual-report URL, or removal of the annual-report claim.
- Accounting and privacy retention period.

These values must be confirmed by the owner or treasurer. Do not infer them from an old email
address, social profile, screenshot, or payment-app search result.

## 6. Administrative experience

Add **Admin → Giving**. Only Administrators may change payment destinations or recipient
verification details. Publishers and Editors must not have that authority.

### 6.1 Giving settings

The settings screen should support:

- Enable or disable each payment method independently.
- Edit the identifier, recipient display name, instructions, memo guidance, and external URL.
- Upload or replace a verified QR image using the existing portable media store.
- Edit the trust statement, support contact, tax wording, receipt turnaround, and FAQ entries.
- Manage designations and impact examples.
- Preview the public page before saving.
- Require an explicit confirmation before changing an active payment destination.
- Write an audit record containing the actor, time, affected method, and a safe summary. Secrets or
  sensitive donor information must not appear in audit summaries.

The public page must hide a method immediately when an Administrator disables it. At least one
method or a clear offline-giving alternative must remain available before the page can be published.

### 6.2 Receipt-request queue

Administrators should be able to:

- View paginated requests.
- Filter by submitted, matched, receipt issued, or unable to match.
- Record a safe internal reconciliation note.
- Mark a request as matched only after checking the external payment account.
- Record when and by whom a receipt was issued.
- Export an accounting-safe CSV with spreadsheet-formula neutralization.

The system does not send a tax receipt automatically in the initial release. Automatic email can be
considered only after approved receipt wording and an appropriate delivery workflow exist.

## 7. Proposed portable data model

The exact migration may adapt naming to repository conventions, but must preserve these concepts.

### `giving_settings`

- Singleton identifier.
- Trust statement.
- Legal/public organization name.
- Tax-status wording.
- Donation-support email and phone.
- Receipt instructions and expected turnaround.
- Updated time and Administrator ID.

### `giving_methods`

- Identifier and method type (`zelle` or `cash_app`).
- Enabled state and display order.
- Public payment identifier.
- Expected recipient name.
- Instructions and memo guidance.
- Approved external URL, when applicable.
- QR media path referencing the existing `media_assets` system.
- Revision, created/updated times, and Administrator IDs.

### `giving_designations`

- Identifier, label, description, enabled state, display order, and audit metadata.

### `giving_impact_items`

- Identifier, amount in cents, statement, evidence/review note, enabled state, display order, and
  review timestamp.

### `giving_receipt_requests`

- Random identifier.
- Donor name and normalized email.
- Amount in cents, method, gift date, designation, short reference, and optional note.
- Consent timestamp and source.
- Workflow state (`submitted`, `matched`, `receipt_issued`, or `unable_to_match`).
- Created/updated times, matcher ID/time, and receipt issuer ID/time.

Giving settings, receipt requests, and audit history must be included in the portable export. QR
images are already covered by the portable media store.

## 8. Public and administrative interfaces

Planned interfaces:

- `GET /give` — server-rendered public page using active giving settings.
- `POST /api/giving/receipt-requests` — public receipt request with origin, consent, size, timing,
  bot-trap, and rate-limit checks.
- `GET /api/admin/giving` — Administrator-only settings and receipt queue.
- `POST /api/admin/giving` — Administrator-only, same-origin settings and workflow changes.

Error responses must be private and must not disclose whether an external transaction, payment
account, or another donor exists. Administrative responses must use `Cache-Control: private,
no-store`.

## 9. Security and privacy requirements

- Never collect payment credentials or attempt to confirm a transfer from browser-supplied data.
- Store the minimum donor information needed for receipt reconciliation.
- Validate and normalize all public input on the server.
- Use explicit consent, a honeypot, request-size limits, timing checks, same-origin validation, and
  rate limiting consistent with the newsletter form.
- Escape rendered content and neutralize spreadsheet formulas in CSV exports.
- Restrict all giving configuration and receipt data to Administrators.
- Audit payment-destination changes, state changes, and receipt issuance.
- Never log donor names, emails, references, or notes in infrastructure logs.
- Do not expose unpublished settings, disabled methods, receipt requests, or audit history to search
  engines or public caches.
- Document an owner-approved retention and deletion policy before accepting receipt requests.
- Use the existing Google identity and application-owned authorization model; do not introduce a
  payment-provider login into the website.

## 10. Accessibility and responsive requirements

- No horizontal overflow at 320, 360, 390, 768, 1024, or 1440 CSS pixels.
- Apply `min-width: 0` to grid children and safe wrapping such as `overflow-wrap: anywhere` to long
  payment identifiers.
- Do not use heading elements merely to enlarge identifiers.
- Every action must have an accessible name, visible focus state, and keyboard operation.
- Copy success must be announced through an `aria-live` status region and must not rely on color.
- QR images require useful alternative text and equivalent text instructions.
- External-link behavior must be announced where it could surprise the visitor.
- Contrast must meet WCAG AA in light and dark themes.
- The page must remain understandable when QR images fail, JavaScript is disabled, or a payment app
  is unavailable.

## 11. SEO and content requirements

- Use an accurate title and description that mention giving to Anglican Church of the Epiphany in
  Houston without promising unavailable payment features.
- Use an absolute canonical URL for `https://acehou.org/give`.
- Add giving-specific Open Graph and social metadata with an approved image.
- Keep the page in the XML sitemap and link to it from relevant public pages.
- Extend the site's verified Church/Organization structured data with the official name and Give URL.
  Add action markup only if it truthfully represents an available action and validates cleanly.
- Do not index receipt-request confirmation or administrative pages.
- Keep the permanent Give URL stable when payment methods change.
- Impact and tax statements must be written for people first and supported by approved evidence;
  they must not be added merely to increase keyword density.

## 12. Implementation phases

### Phase 0 — owner and treasurer verification

1. Confirm every item in section 5.
2. Test both payment identifiers with a small owner-authorized transfer outside the website.
3. Capture verified QR images directly from the church-owned accounts.
4. Approve receipt language and reconciliation responsibility.
5. Approve the retention policy.

No payment identifier is changed in production during development without explicit owner approval.

### Phase 1 — trustworthy public page

1. Remove unused donation state, imports, constants, handler, and commented checkout code.
2. Shorten the Give-page hero.
3. Build responsive, accessible payment-method cards.
4. Add copy controls, approved external link, verified QR images, recipient verification, memo
   guidance, support contact, and offline fallback.
5. Correct FAQ, impact, canonical, description, and social metadata.
6. Fix mobile overflow and verify light/dark modes.

This phase can initially use reviewed configuration in code if necessary, but the page must not be
considered complete until Phase 2 removes that operational dependency.

### Phase 2 — Administrator-managed settings

1. Add migrations and portable transfer coverage.
2. Add server-side validation, repository operations, permissions, and audit events.
3. Add the Admin → Giving settings and preview interface.
4. Reuse the existing media upload system for QR images.
5. Replace hardcoded giving content with server-rendered database content.

### Phase 3 — receipt requests and reconciliation

1. Add the public request form and abuse controls.
2. Add the Administrator receipt queue and safe CSV export.
3. Add matching and receipt-issued states with audit history.
4. Add privacy copy and the approved retention process.
5. Keep receipt creation/manual delivery outside the automatic workflow until separately approved.

### Phase 4 — production release

1. Apply the migration locally and run automated tests.
2. Test local Node/SQLite and local Cloudflare runtimes.
3. Test desktop/mobile, keyboard, no-JavaScript fallback, light/dark mode, and screen-reader names.
4. Have the owner verify identifiers, recipient names, links, and QR codes in the release candidate.
5. Export the production database before applying the remote migration.
6. Apply the migration and deploy through the existing Cloudflare Worker.
7. Perform one owner-authorized production transfer and reconcile its receipt request.
8. Monitor logs and the admin audit feed without recording donor-sensitive content.

## 13. Required automated tests

- Public rendering includes only enabled methods and contains no sensitive settings.
- Copy/link/QR fallbacks remain usable without JavaScript.
- Only Administrators can read or change payment settings and receipt records.
- Payment-destination changes require validation, optimistic concurrency, confirmation, and audit.
- QR uploads accept only verified image types and preserve portable media behavior.
- Receipt requests require consent and reject invalid amounts, dates, methods, oversized bodies,
  bot submissions, cross-origin requests, and rate-limit abuse.
- Duplicate submissions are handled safely without revealing existing records.
- Receipt-state transitions are permission-checked and audited.
- CSV export is Administrator-only and neutralizes formulas.
- Private endpoints and confirmations cannot be publicly cached or indexed.
- Portable export/restore preserves giving settings, receipt requests, and QR media but excludes
  sessions and deployment secrets.
- SEO metadata is accurate, canonical URLs are production-safe, and structured data parses.

## 14. Definition of done

The giving feature is complete only when:

- Owner-approved payment identifiers and recipient names are displayed.
- Both active methods work on desktop and mobile using text instructions as well as enhanced actions.
- No horizontal scrolling occurs at the required breakpoints.
- The website never accepts payment credentials and never claims a transfer succeeded.
- The tax, receipt, annual-report, designation, and impact wording is approved and accurate.
- Administrators can update giving content without a code deployment, with audit history.
- A donor can request a receipt and an Administrator can reconcile the request without exposing
  private information.
- Accessibility, security, portability, SEO, and automated test requirements pass.
- Cloudflare remains on the free plan with no usage-billed product enabled.
- The owner completes and signs off on the production transfer rehearsal.

## 15. Deferred capabilities

The following are explicitly outside the initial release:

- Embedded card or bank-account fields.
- Website-side payment processing or payment confirmation.
- Automatic recurring giving.
- Automatic provider webhooks.
- Automatically generated or emailed tax receipts.
- Donor accounts and donation-history portals.
- Public donor names, amounts, or fundraising totals.
- A paid giving platform.

If card payments or recurring gifts are later approved, implement them through a replaceable
provider adapter and hosted provider checkout. Document provider and transaction fees, portability,
webhooks, refund handling, reconciliation, privacy, and migration before enabling the provider.

## 16. Change control

Record approved changes in this section before implementation when they alter money destinations,
data collection, permissions, tax/receipt language, external providers, cost constraints, or the
definition of done.

| Date       | Decision                                                                                                                               | Approved by | Implementation status               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------- |
| 2026-09-21 | Keep the website outside payment processing and preserve $0 Cloudflare cost. Use approved external methods for the initial experience. | Site owner  | Planned                             |
| 2026-09-23 | Use environment values as portable local defaults, with Administrator-saved database overrides. Missing payment details fail closed.   | Site owner  | Implemented locally; review pending |
| 2026-09-23 | Add a visibly labelled, non-payable local simulation and QR image uploads. Simulation settings are automatically suppressed outside localhost. | Site owner | Implemented locally; review pending |
