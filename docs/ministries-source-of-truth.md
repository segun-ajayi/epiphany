# Ministries source of truth

**Status:** Implemented locally on September 24, 2026. No production migration or deployment has
been performed.

## Public experience

- `/ministries` is the browsable ministry directory.
- Every published ministry has a permanent page at `/ministries/{slug}`.
- Directory and homepage cards link to the permanent page instead of opening a temporary modal.
- Each page can show the audience, schedule, meeting location, leader and role, direct email and
  phone contact, newcomer expectations, and joining instructions.
- Ministry pages include a canonical URL, social-sharing metadata, and Organization structured data.
- Published ministry pages are included automatically in `sitemap.xml` with their last update time.

## Administration

Editors and administrators manage ministries in **Admin → Ministries**. The URL slug is generated
from the ministry name and becomes permanent after first publication. Images are uploaded through
the existing optimized media workflow.

Complete these fields before publishing a strong page:

1. Ministry name, summary, and full description.
2. A current image with an accurate image description.
3. Who the ministry serves, when it meets, and where it meets.
4. The current leader's name and role.
5. A monitored contact email and, where appropriate, phone number.
6. What a newcomer should expect and a specific next step for joining.
7. A concise search title and search description when the defaults are not sufficient.

Blank optional details are omitted from the public page. If ministry contact details are blank, the
page uses the church's Site Settings contact information.

## Data and deployment

Migration `0015_ministry_details.sql` adds only nullable columns and preserves every existing
ministry record. Local migration and review must be completed before the normal production backup,
remote migration, build, and deployment procedure. Remote migration is never part of the standard
build command.
