# Event registration source of truth

## Product rule

Most church events are open to everyone and require no registration. New and existing events use
`not_required` by default, so no registration form appears. An administrator may deliberately use
`open`, `closed`, or `full` for the smaller set of events that require attendee sign-up.

## Public workflow

- The registration form appears only on a published, future event whose registration status is
  `open`.
- A visitor supplies a name, email, optional phone, party size, optional note, and explicit consent.
- One email address can register once per event. Changes are handled by the church to prevent an
  unauthenticated visitor from altering another person's registration.
- Party size is limited to 20 per submission. When an event has a capacity, the database accepts a
  registration only if the full party fits at the moment of insertion.
- Same-origin checks, a dedicated request header, a 12 KB request limit, a timing check, a honeypot,
  validation, and an hourly shared rate limit protect the endpoint.

## Administrator workflow

- Only administrators can see attendee names and contact information.
- The Registrations panel supports `registered`, `attended`, and `cancelled` states plus private
  notes.
- A cancelled registration releases its party size. Restoring it checks capacity again.
- Permanent deletion is available only after cancellation and is recorded in the audit log.
- CSV export quotes fields and neutralizes spreadsheet-formula prefixes.

## Portability and cost

The feature uses the existing portable SQLite/D1 abstraction and the current Cloudflare Worker. It
does not require a paid service, Cloudflare-specific identity product, or third-party registration
provider. Migration `0021_event_registrations.sql` owns the schema and has a reviewed manual
rollback file.

## Deployment gate

This feature is local until it is reviewed and explicitly approved for production. Before a future
deployment: back up the remote D1 database, apply migration 0021, deploy the application, open one
test event briefly, submit and manage a test registration, verify CSV export, then restore the
event's intended registration status.
