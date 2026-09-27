import assert from "node:assert/strict";
import { test } from "node:test";
import { AdminError, type AdminUser } from "../src/lib/auth/permissions.ts";
import {
  createContactMessage,
  loadContactInbox,
  updateContactMessage,
} from "../src/lib/contact/repository.server.ts";
import { TestDatabase } from "./d1-test-adapter.ts";

const administrator: AdminUser = {
  id: "initial-administrator",
  email: "mortalerror@gmail.com",
  role: "administrator",
};
const submission = {
  firstName: "Test",
  lastName: "Visitor",
  email: "visitor@example.com",
  phone: "",
  topic: "prayer" as const,
  subject: "Prayer request",
  message: "Please pray for a private concern this week.",
  consent: true as const,
  website: "",
  startedAt: Date.now() - 3000,
};

test("contact messages are duplicate-safe and administrator-only", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  await createContactMessage(db, submission);
  await createContactMessage(db, submission);
  const inbox = await loadContactInbox(db, administrator);
  assert.equal(inbox.total, 1);
  assert.equal(inbox.unread, 1);
  assert.equal(inbox.messages[0].topic, "prayer");
  await assert.rejects(
    loadContactInbox(db, { ...administrator, role: "publisher" }),
    (error: unknown) => error instanceof AdminError && error.status === 403,
  );
});

test("contact messages can be resolved and deliberately deleted", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  await createContactMessage(db, submission);
  let item = (await loadContactInbox(db, administrator)).messages[0];
  await updateContactMessage(db, administrator, {
    action: "status",
    id: item.id,
    status: "resolved",
    internalNote: "Responded privately.",
    updatedAt: item.updatedAt,
  });
  item = (await loadContactInbox(db, administrator)).messages[0];
  assert.equal(item.status, "resolved");
  assert.equal(item.internalNote, "Responded privately.");
  assert.ok(item.resolvedAt);
  await updateContactMessage(db, administrator, {
    action: "delete",
    id: item.id,
    updatedAt: item.updatedAt,
  });
  assert.equal((await loadContactInbox(db, administrator)).total, 0);
});
