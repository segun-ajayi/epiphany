# Admin content management source of truth

Last reviewed: 2026-09-25

## Purpose

The administration workspace is the canonical place for managing meaningful public website content. Content remains portable in D1 and the application does not depend on Cloudflare-specific identity, image, or email products.

## Admin navigation

The workspace uses a responsive side navigation on larger screens and a compact grid on smaller screens.

- **Content:** Ministries, Events, Sermons, Gallery, Leadership
- **Engagement:** Messages, Registrations, Giving, Newsletter
- **Configuration:** Site & pages, Team

Only administrators see private engagement and configuration sections. Editors and publishers retain their existing role-based content permissions.

## Managed public content

### Site & pages

- Church and denominational identity, tagline, address, phone, email, and official social profiles
- Service times and descriptions
- Header/footer logo and social-sharing image
- Footer quotation
- Default SEO title and description
- Visitor parking, children/family, accessibility, and service-duration guidance
- Homepage hero introduction and image
- Rector welcome heading, message, name, credentials, role, and image
- Homepage service, ministry, event, sermon, giving, and testimonial headings/content
- Repeatable homepage testimonials
- About hero, mission, vision, history milestones, beliefs, and hero image
- Visit hero, introduction, expectations, FAQs, closing message, and hero image
- Ministries, Events, Sermons, Gallery, Contact, and Give page hero text and images

### Dedicated managers

- Ministries, including schedules, leaders, contact details, newcomer guidance, images, publication, and SEO
- Events, including dates, venue, registration choice, image, publication, SEO, and automatic newsletter workflow
- Sermons, including media links, notes PDF, metadata, image, publication, and SEO
- Gallery albums and optimized photographs
- Clergy and staff profiles
- Giving presentation, methods, ownership confirmation, designations, impact examples, and receipt requests
- Newsletter subscribers, provider choice, reconciliation, templates, previews, and event campaigns
- Contact messages and event registrations
- Administrator/editor/publisher membership and roles

## Intentionally static application text

The following remains in code because it describes application behavior rather than church content:

- Navigation and button labels
- Form field labels, validation messages, consent language, and security notices
- Empty states and error-recovery messages
- Accessibility labels and skip navigation
- Structural section labels such as “Mission”, “Vision”, and “Our Story”
- Safe bundled fallback images and fallback settings used only when persisted content is unavailable

Changing these items normally requires development review because careless edits could harm usability, accessibility, privacy, or security.

## Storage and compatibility

- Shared page content is stored in the single revision-protected `site_settings` JSON document.
- Operational content remains in its normalized portable tables.
- Uploaded images remain signature-checked in `media_assets` and are served through `/media/:id`.
- Older settings documents are completed field-by-field from safe defaults without losing saved values.
- The confirmed local values were materialized into the local D1 database on 2026-09-25.
- Production values must be reviewed and saved through **Site & pages** after the production database backup and migration gate.

## Release rule

No production deployment is authorized by this document. Production changes still require explicit owner approval, a database backup, migration review, and the smoke-test checklist in the launch-readiness audit.
