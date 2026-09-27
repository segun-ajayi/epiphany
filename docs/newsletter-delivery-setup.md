# Newsletter delivery setup

The website keeps its own consent register and can connect to either Kit or Sender. Only one
provider is active at a time. Changing the choice controls both subscriber synchronization and new
event newsletter delivery; changing it by itself does not send an email.

## HTML designs and browser copies

The admin Newsletter screen includes three responsive HTML designs inspired by the public site:
**Heritage**, **Sunday Light**, and **Evening Prayer**. An administrator can preview each design,
download Sender-ready HTML, and choose the active design. Choosing a design is audited and never
sends a message.

The welcome letter has a permanent public browser copy at `/newsletter/welcome`. Each event
newsletter has a stable browser copy at `/newsletter/events/{event-slug}`. The selected design at
the moment an event is published is stored with that campaign, so a later design change does not
alter an already queued email. Browser copies are marked `noindex` so they remain useful to readers
without competing with the site's public search pages. Email HTML includes a browser-view link,
event call to action, and provider-compatible unsubscribe link.

## Event publication workflow

When an event moves from draft to published, the content write and a newsletter outbox record are
committed together. Publication is never rolled back because an email provider is unavailable.
Cloudflare checks the outbox every five minutes, creates an HTML campaign for the active provider,
and sends it to the configured Sender group or Kit tag. The event ID is unique in the outbox, so
editing or republishing the same event does not create a second campaign.

Administrators can enable or pause this automation in **Admin → Newsletter**, inspect queued,
sent, and failed campaigns, open the browser copy, and retry a failed campaign. A retry is an
explicit send action. Provider errors are recorded without exposing credentials, and failed work
is retained for later retries.

## Safety and portability

- Subscribers, consent timestamps, provider choice, and synchronization history live in the site
  database and are included in portable exports.
- API credentials never live in the database, browser, source code, or export files. They are
  deployment secrets and must be recreated when the site moves hosts.
- A Kit tag and Sender group keep church subscribers separate from any other contacts in those
  accounts. The admin screen will not allow a provider to be selected until both its credential and
  audience ID are present.
- Event campaigns are created and sent automatically only when the event workflow is enabled.
  Other newsletter types still require a separate workflow or provider-dashboard send.
- Manual synchronization processes at most 25 changed records per request. New signups and admin
  status changes synchronize automatically while a provider is active.
- Cloudflare invokes the provider-neutral reconciliation service daily at 08:15 UTC. It checks at
  most 25 active subscribers, imports suppressions one-way, and records the last run/error for the
  admin dashboard. Run a manual provider check immediately before a campaign as an extra safeguard.
- Cloudflare checks up to three due event campaigns every five minutes. These scheduled checks use
  the existing Worker and D1 deployment and require no additional paid Cloudflare product.

## Kit

1. Create the Kit account and complete its sender-domain verification.
2. Create a tag for website newsletter subscribers.
3. Create a Kit v4 API key and copy the tag ID.
4. For local development, add `KIT_API_KEY` and `KIT_TAG_ID` to `.dev.vars`.
5. For Cloudflare, add `KIT_API_KEY` and `KIT_TAG_ID` as encrypted Worker secrets. Do not add them
   to `wrangler.toml`.

## Sender

1. Create the Sender account and complete its sender-domain verification.
2. Create a group for website newsletter subscribers.
3. Create an API token and copy the group ID.
4. For local development, add `SENDER_API_TOKEN` and `SENDER_GROUP_ID` to `.dev.vars`.
5. For Cloudflare, add `SENDER_API_TOKEN` and `SENDER_GROUP_ID` as encrypted Worker secrets. Do not
   add them to `wrangler.toml`.

## Activating and switching

After restarting the local preview, open **Admin → Newsletter**, choose a configured provider, and
save. Run **Sync next 25** until Pending is zero before enabling event delivery.

Before switching providers, reconcile suppression and unsubscribe records in the current provider,
then select the new provider and synchronize it. Never upload an old CSV that includes unsubscribed,
bounced, or complained contacts.
