import type { SqlDatabase } from "../db/sql.types.ts";
import { AdminError, type AdminUser } from "../auth/permissions.ts";
import {
  eventRegistrationSchema,
  registrationAdminMutationSchema,
  type EventRegistration,
} from "./schemas.ts";

function assertAdministrator(user: AdminUser) {
  if (user.role !== "administrator")
    throw new AdminError(403, "forbidden", "Only administrators may manage attendee details.");
}

export async function createEventRegistration(db: SqlDatabase, input: unknown) {
  const registration = eventRegistrationSchema.parse(input);
  const event = await db
    .prepare(
      `SELECT id, title, starts_at, capacity, registration_status FROM events
    WHERE slug = ? AND status = 'published' AND published_at <= ? LIMIT 1`,
    )
    .bind(registration.eventSlug, new Date().toISOString())
    .first<{
      id: string;
      title: string;
      starts_at: string;
      capacity: number | null;
      registration_status: string;
    }>();
  if (!event) throw new AdminError(404, "event_unavailable", "This event is not available.");
  if (event.registration_status !== "open")
    throw new AdminError(409, "registration_closed", "Registration is not open for this event.");
  if (event.starts_at <= new Date().toISOString())
    throw new AdminError(
      409,
      "event_started",
      "Registration has closed because this event has started.",
    );
  const duplicate = await db
    .prepare("SELECT id FROM event_registrations WHERE event_id = ? AND email = ? LIMIT 1")
    .bind(event.id, registration.email)
    .first<{ id: string }>();
  if (duplicate)
    throw new AdminError(
      409,
      "already_registered",
      "This email is already registered for the event. Contact the church to make changes.",
    );
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO event_registrations (id, event_id, full_name, email, phone, party_size,
    note, consent_at, status, internal_note, created_at, updated_at)
    SELECT ?, e.id, ?, ?, ?, ?, ?, ?, 'registered', '', ?, ? FROM events e WHERE e.id = ?
      AND e.registration_status = 'open'
      AND (e.capacity IS NULL OR (SELECT COALESCE(SUM(r.party_size), 0) FROM event_registrations r
        WHERE r.event_id = e.id AND r.status IN ('registered', 'attended')) + ? <= e.capacity)`,
    )
    .bind(
      id,
      registration.fullName,
      registration.email,
      registration.phone || null,
      registration.partySize,
      registration.note || null,
      now,
      now,
      now,
      event.id,
      registration.partySize,
    )
    .run();
  const saved = await db
    .prepare("SELECT id FROM event_registrations WHERE id = ?")
    .bind(id)
    .first<{ id: string }>();
  if (!saved)
    throw new AdminError(409, "event_full", "This event no longer has enough available places.");
  return { ok: true as const, message: `You are registered for ${event.title}.` };
}

type Row = {
  id: string;
  event_id: string;
  event_title: string;
  event_slug: string;
  event_starts_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  party_size: number;
  note: string | null;
  consent_at: string;
  status: EventRegistration["status"];
  internal_note: string;
  created_at: string;
  updated_at: string;
};
const select = `SELECT r.id, r.event_id, e.title AS event_title, e.slug AS event_slug, e.starts_at AS event_starts_at,
  r.full_name, r.email, r.phone, r.party_size, r.note, r.consent_at, r.status, r.internal_note,
  r.created_at, r.updated_at FROM event_registrations r JOIN events e ON e.id = r.event_id`;
function map(row: Row): EventRegistration {
  return {
    id: row.id,
    eventId: row.event_id,
    eventTitle: row.event_title,
    eventSlug: row.event_slug,
    eventStartsAt: row.event_starts_at,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone || "",
    partySize: row.party_size,
    note: row.note || "",
    consentAt: row.consent_at,
    status: row.status,
    internalNote: row.internal_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadRegistrations(db: SqlDatabase, user: AdminUser, page = 0) {
  assertAdministrator(user);
  const limit = 25;
  const [rows, total] = await db.batch([
    db
      .prepare(`${select} ORDER BY e.starts_at DESC, r.created_at DESC LIMIT ? OFFSET ?`)
      .bind(limit, page * limit),
    db.prepare("SELECT COUNT(*) AS total FROM event_registrations"),
  ]);
  return {
    registrations: (rows.results as Row[]).map(map),
    total: Number((total.results[0] as { total?: number })?.total || 0),
    page,
    pageSize: limit,
  };
}

export async function updateRegistration(db: SqlDatabase, user: AdminUser, input: unknown) {
  assertAdministrator(user);
  const mutation = registrationAdminMutationSchema.parse(input);
  const existing = await db
    .prepare(
      "SELECT event_id, party_size, status, updated_at FROM event_registrations WHERE id = ?",
    )
    .bind(mutation.id)
    .first<{ event_id: string; party_size: number; status: string; updated_at: string }>();
  if (!existing) throw new AdminError(404, "not_found", "This registration no longer exists.");
  if (existing.updated_at !== mutation.updatedAt)
    throw new AdminError(409, "conflict", "This registration changed. Reload and try again.");
  const now = new Date().toISOString();
  if (mutation.action === "delete") {
    if (existing.status !== "cancelled")
      throw new AdminError(409, "cancel_first", "Cancel the registration before deleting it.");
    await db.batch([
      db
        .prepare("DELETE FROM event_registrations WHERE id = ? AND updated_at = ?")
        .bind(mutation.id, mutation.updatedAt),
      db
        .prepare(
          `INSERT INTO audit_log (id, actor_id, action, content_type, record_id, summary, created_at)
        VALUES (?, ?, 'registration.delete', 'event_registration', ?, 'Permanently deleted a cancelled registration.', ?)`,
        )
        .bind(crypto.randomUUID(), user.id, mutation.id, now),
    ]);
    return { ok: true as const };
  }
  if (existing.status === "cancelled" && mutation.status !== "cancelled") {
    const event = await db
      .prepare(
        `SELECT capacity, (SELECT COALESCE(SUM(party_size), 0) FROM event_registrations
      WHERE event_id = ? AND status IN ('registered', 'attended')) AS reserved FROM events WHERE id = ?`,
      )
      .bind(existing.event_id, existing.event_id)
      .first<{ capacity: number | null; reserved: number }>();
    if (event?.capacity && event.reserved + existing.party_size > event.capacity)
      throw new AdminError(
        409,
        "event_full",
        "There is no longer enough capacity to restore this registration.",
      );
  }
  await db.batch([
    db
      .prepare(
        "UPDATE event_registrations SET status = ?, internal_note = ?, updated_at = ? WHERE id = ? AND updated_at = ?",
      )
      .bind(mutation.status, mutation.internalNote, now, mutation.id, mutation.updatedAt),
    db
      .prepare(
        `INSERT INTO audit_log (id, actor_id, action, content_type, record_id, summary, created_at)
      VALUES (?, ?, 'registration.status', 'event_registration', ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        user.id,
        mutation.id,
        `Marked registration ${mutation.status}.`,
        now,
      ),
  ]);
  return { ok: true as const };
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
export async function exportRegistrationsCsv(db: SqlDatabase, user: AdminUser) {
  assertAdministrator(user);
  const rows = await db
    .prepare(`${select} ORDER BY e.starts_at DESC, r.created_at DESC LIMIT 10000`)
    .all<Row>();
  return [
    [
      "Event",
      "Event start",
      "Name",
      "Email",
      "Phone",
      "Party size",
      "Status",
      "Note",
      "Registered at",
    ]
      .map(csvCell)
      .join(","),
    ...rows.results.map((r) =>
      [
        r.event_title,
        r.event_starts_at,
        r.full_name,
        r.email,
        r.phone,
        r.party_size,
        r.status,
        r.note,
        r.created_at,
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\r\n");
}
