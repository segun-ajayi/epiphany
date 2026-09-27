import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminUser } from "../src/lib/auth/permissions.ts";
import {
  createTeamMember,
  listTeamMembers,
  updateTeamMember,
} from "../src/lib/team/repository.server.ts";
import { TestDatabase } from "./d1-test-adapter.ts";

const admin: AdminUser = {
  id: "initial-administrator",
  email: "mortalerror@gmail.com",
  role: "administrator",
};

test("administrators can approve, promote and disable Google team accounts", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  await createTeamMember(db, admin, {
    action: "create",
    email: "Editor@Example.com",
    role: "editor",
  });
  let data = await listTeamMembers(db, admin);
  const editor = data.members.find((member) => member.email === "editor@example.com");
  assert.ok(editor);
  assert.equal(editor.linked, false);
  assert.equal(editor.active, true);
  await updateTeamMember(db, admin, {
    action: "update",
    id: editor.id,
    role: "publisher",
    active: false,
    updatedAt: editor.updatedAt,
  });
  data = await listTeamMembers(db, admin);
  const updated = data.members.find((member) => member.id === editor.id)!;
  assert.equal(updated.role, "publisher");
  assert.equal(updated.active, false);
  assert.equal(
    db.sqlite.prepare("SELECT action FROM audit_log ORDER BY rowid DESC").get()?.action,
    "team.update",
  );
});

test("team management prevents duplicates, non-admin access and administrator lockout", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  await assert.rejects(
    listTeamMembers(db, { ...admin, role: "publisher" }),
    (error: unknown) =>
      !!error && typeof error === "object" && "status" in error && error.status === 403,
  );
  await assert.rejects(
    createTeamMember(db, admin, {
      action: "create",
      email: admin.email,
      role: "editor",
    }),
    (error: unknown) =>
      !!error && typeof error === "object" && "status" in error && error.status === 409,
  );
  const current = (await listTeamMembers(db, admin)).members.find(
    (member) => member.id === admin.id,
  )!;
  await assert.rejects(
    updateTeamMember(db, admin, {
      action: "update",
      id: current.id,
      role: "editor",
      active: true,
      updatedAt: current.updatedAt,
    }),
    (error: unknown) =>
      !!error && typeof error === "object" && "code" in error && error.code === "self_lockout",
  );
});
