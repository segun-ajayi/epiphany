# Contact messages source of truth

**Status:** Implemented locally on September 24, 2026. No production migration or deployment has
been performed.

## Public submission

The form at `/contact` accepts general questions, visit enquiries, ministry enquiries, prayer
requests, and pastoral-care requests. A visitor supplies their name, email address, optional phone
and subject, message, and explicit consent for the church to store the submission and respond.

The endpoint accepts only same-origin JSON requests with the application request header. It limits
body size, rejects submissions completed unrealistically quickly or held longer than 24 hours,
silently discards filled honeypots, applies a shared hourly submission ceiling, validates every
field, and suppresses an identical email/message submission received within ten minutes.

No message is sent to a newsletter provider and no visitor becomes a newsletter subscriber.

## Administrator inbox

Only administrators can access **Admin → Messages**. Editors and publishers cannot read this
private correspondence. Administrators may mark messages new, read, or resolved; keep an internal
note; reply using their email application; and permanently delete a resolved message after an
explicit confirmation. Status changes and deletions are written to the audit log without copying
the private message text into that log.

Prayer and pastoral-care messages must be treated as confidential church correspondence. The
database should not be treated as a clinical, safeguarding, or emergency-response system. The
public church phone number remains available for matters that should not be submitted online.

## Deployment order

Before production deployment: export the remote database, apply `0020_contact_messages.sql`, build
and deploy, submit one clearly labelled test message, verify it appears only for an administrator,
mark it resolved, permanently delete it, and confirm the public success and failure messages.
