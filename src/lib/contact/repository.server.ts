import type { SqlDatabase } from "../db/sql.types.ts";
import { AdminError, type AdminUser } from "../auth/permissions.ts";
import {
  contactAdminMutationSchema,
  contactSubmissionSchema,
  type ContactMessage,
} from "./schemas.ts";

function assertAdministrator(user: AdminUser) {
  if (user.role !== "administrator")
    throw new AdminError(403, "forbidden", "Only administrators may view private messages.");
}

type ContactRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  topic: ContactMessage["topic"];
  subject: string | null;
  message: string;
  consent_at: string;
  status: ContactMessage["status"];
  internal_note: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

function mapMessage(row: ContactRow): ContactMessage {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone || "",
    topic: row.topic,
    subject: row.subject || "",
    message: row.message,
    consentAt: row.consent_at,
    status: row.status,
    internalNote: row.internal_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
  };
}

export async function createContactMessage(db: SqlDatabase, input: unknown) {
  const message = contactSubmissionSchema.parse(input);
  const now = new Date().toISOString();
  const recent = await db
    .prepare(
      `SELECT id FROM contact_messages WHERE email = ? AND message = ?
      AND created_at >= ? LIMIT 1`,
    )
    .bind(message.email, message.message, new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .first<{ id: string }>();
  if (!recent) {
    await db
      .prepare(
        `INSERT INTO contact_messages (id, first_name, last_name, email, phone, topic,
      subject, message, consent_at, status, internal_note, created_at, updated_at, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', '', ?, ?, NULL)`,
      )
      .bind(
        crypto.randomUUID(),
        message.firstName,
        message.lastName,
        message.email,
        message.phone || null,
        message.topic,
        message.subject || null,
        message.message,
        now,
        now,
        now,
      )
      .run();
  }
  return { ok: true as const, message: "Thank you — your message has been received." };
}

export async function loadContactInbox(db: SqlDatabase, user: AdminUser, page = 0) {
  assertAdministrator(user);
  const limit = 25;
  const [rows, counts] = await db.batch([
    db
      .prepare(
        "SELECT * FROM contact_messages ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'read' THEN 1 ELSE 2 END, created_at DESC LIMIT ? OFFSET ?",
      )
      .bind(limit, page * limit),
    db.prepare(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS unread FROM contact_messages",
    ),
  ]);
  const summary = counts.results[0] as { total: number; unread: number | null } | undefined;
  return {
    messages: (rows.results as ContactRow[]).map(mapMessage),
    total: summary?.total ?? 0,
    unread: summary?.unread ?? 0,
    page,
    pageSize: limit,
  };
}

export async function updateContactMessage(db: SqlDatabase, user: AdminUser, input: unknown) {
  assertAdministrator(user);
  const mutation = contactAdminMutationSchema.parse(input);
  const existing = await db
    .prepare("SELECT status, updated_at FROM contact_messages WHERE id = ?")
    .bind(mutation.id)
    .first<{ status: string; updated_at: string }>();
  if (!existing) throw new AdminError(404, "not_found", "This message no longer exists.");
  if (existing.updated_at !== mutation.updatedAt)
    throw new AdminError(409, "conflict", "This message changed. Reload and try again.");
  const now = new Date().toISOString();
  if (mutation.action === "delete") {
    await db.batch([
      db
        .prepare("DELETE FROM contact_messages WHERE id = ? AND updated_at = ?")
        .bind(mutation.id, mutation.updatedAt),
      db
        .prepare(
          `INSERT INTO audit_log (id, actor_id, action, content_type, record_id, summary, created_at)
        VALUES (?, ?, 'contact.delete', 'contact_message', ?, 'Permanently deleted a contact message.', ?)`,
        )
        .bind(crypto.randomUUID(), user.id, mutation.id, now),
    ]);
    return { ok: true as const };
  }
  await db.batch([
    db
      .prepare(
        `UPDATE contact_messages SET status = ?, internal_note = ?, updated_at = ?,
      resolved_at = CASE WHEN ? = 'resolved' THEN COALESCE(resolved_at, ?) ELSE NULL END
      WHERE id = ? AND updated_at = ?`,
      )
      .bind(
        mutation.status,
        mutation.internalNote,
        now,
        mutation.status,
        now,
        mutation.id,
        mutation.updatedAt,
      ),
    db
      .prepare(
        `INSERT INTO audit_log (id, actor_id, action, content_type, record_id, summary, created_at)
      VALUES (?, ?, 'contact.status', 'contact_message', ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        user.id,
        mutation.id,
        `Marked contact message ${mutation.status}.`,
        now,
      ),
  ]);
  return { ok: true as const };
}
