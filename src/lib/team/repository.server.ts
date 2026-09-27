import { AdminError, type AdminUser } from "../auth/permissions.ts";
import type { SqlDatabase } from "../db/sql.types.ts";
import { teamMemberCreateSchema, teamMemberUpdateSchema, type TeamMember } from "./schemas.ts";

function assertAdministrator(user: AdminUser) {
  if (user.role !== "administrator") {
    throw new AdminError(403, "forbidden", "Only administrators may manage the church team.");
  }
}

type TeamRow = {
  id: string;
  email: string;
  role: TeamMember["role"];
  active: number;
  google_subject: string | null;
  created_at: string;
  updated_at: string;
};

const mapMember = (row: TeamRow): TeamMember => ({
  id: row.id,
  email: row.email,
  role: row.role,
  active: row.active === 1,
  linked: Boolean(row.google_subject),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function listTeamMembers(db: SqlDatabase, user: AdminUser) {
  assertAdministrator(user);
  const rows = await db
    .prepare(
      `SELECT id, email, role, active, google_subject, created_at, updated_at
       FROM admin_users
       ORDER BY active DESC,
         CASE role WHEN 'administrator' THEN 0 WHEN 'publisher' THEN 1 ELSE 2 END,
         email`,
    )
    .all<TeamRow>();
  return { members: rows.results.map(mapMember), currentUserId: user.id };
}

export async function createTeamMember(db: SqlDatabase, user: AdminUser, input: unknown) {
  assertAdministrator(user);
  const member = teamMemberCreateSchema.parse(input);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO admin_users (id, email, role, active, created_at, updated_at)
           VALUES (?, ?, ?, 1, ?, ?)`,
        )
        .bind(id, member.email, member.role, now, now),
      db
        .prepare(
          `INSERT INTO audit_log
            (id, actor_id, action, content_type, record_id, summary, created_at)
           VALUES (?, ?, 'team.create', 'admin_user', ?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), user.id, id, `Approved ${member.email} as ${member.role}.`, now),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      throw new AdminError(409, "duplicate_email", "That email already has a team record.");
    }
    throw error;
  }
  return { ok: true as const, id };
}

export async function updateTeamMember(db: SqlDatabase, user: AdminUser, input: unknown) {
  assertAdministrator(user);
  const change = teamMemberUpdateSchema.parse(input);
  const existing = await db
    .prepare("SELECT id, email, role, active, updated_at FROM admin_users WHERE id = ?")
    .bind(change.id)
    .first<{
      id: string;
      email: string;
      role: TeamMember["role"];
      active: number;
      updated_at: string;
    }>();
  if (!existing) throw new AdminError(404, "not_found", "This team member no longer exists.");
  if (existing.updated_at !== change.updatedAt) {
    throw new AdminError(409, "conflict", "This team member changed. Refresh and try again.");
  }
  if (existing.id === user.id && (!change.active || change.role !== "administrator")) {
    throw new AdminError(409, "self_lockout", "You cannot remove your own administrator access.");
  }
  if (existing.role === change.role && existing.active === Number(change.active)) {
    return { ok: true as const };
  }
  if (
    existing.role === "administrator" &&
    existing.active === 1 &&
    (!change.active || change.role !== "administrator")
  ) {
    const count = await db
      .prepare(
        "SELECT COUNT(*) AS total FROM admin_users WHERE role = 'administrator' AND active = 1",
      )
      .first<{ total: number }>();
    if ((count?.total ?? 0) <= 1) {
      throw new AdminError(
        409,
        "last_administrator",
        "At least one active administrator is required.",
      );
    }
  }
  const now = new Date().toISOString();
  const summary = `${change.active ? "Set" : "Disabled"} ${existing.email}${
    change.active ? ` as ${change.role}` : ""
  }.`;
  const results = await db.batch([
    db
      .prepare(
        `UPDATE admin_users
         SET role = ?, active = ?, auth_version = auth_version + ?, updated_at = ?
         WHERE id = ? AND updated_at = ?`,
      )
      .bind(
        change.role,
        Number(change.active),
        existing.active === 1 && !change.active ? 1 : 0,
        now,
        change.id,
        change.updatedAt,
      ),
    db
      .prepare(
        `INSERT INTO audit_log
          (id, actor_id, action, content_type, record_id, summary, created_at)
         SELECT ?, ?, 'team.update', 'admin_user', ?, ?, ? WHERE changes() = 1`,
      )
      .bind(crypto.randomUUID(), user.id, change.id, summary, now),
  ]);
  if (results[0].meta?.changes !== 1) {
    throw new AdminError(409, "conflict", "This team member changed. Refresh and try again.");
  }
  return { ok: true as const };
}
