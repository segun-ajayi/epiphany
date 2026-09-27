import assert from "node:assert/strict";
import { test } from "node:test";
import { AdminError, type AdminUser } from "../src/lib/auth/permissions.ts";
import {
  createEventRegistration,
  exportRegistrationsCsv,
  loadRegistrations,
  updateRegistration,
} from "../src/lib/registrations/repository.server.ts";
import { TestDatabase } from "./d1-test-adapter.ts";

const administrator: AdminUser = {
  id: "initial-administrator",
  email: "mortalerror@gmail.com",
  role: "administrator",
};

function addEvent(db: TestDatabase, capacity: number | null = 5) {
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.sqlite
    .prepare(
      `INSERT INTO events (id, slug, title, summary, description, category, starts_at,
       registration_status, capacity, status, published_at, created_at, updated_at)
       VALUES ('event-registration-test', 'registration-test', 'Registration Test', 'Summary',
       'Description', 'Fellowship', ?, 'open', ?, 'published', ?, ?, ?)`,
    )
    .run(future, capacity, now, now, now);
}

function submission(email: string, partySize = 1) {
  return {
    eventSlug: "registration-test",
    fullName: "Test Visitor",
    email,
    phone: "",
    partySize,
    note: "",
    consent: true as const,
    website: "",
    startedAt: Date.now() - 3000,
  };
}

test("event registration is optional, duplicate-safe, and administrator-only", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  addEvent(db);
  await createEventRegistration(db, submission("visitor@example.com", 2));
  await assert.rejects(
    createEventRegistration(db, submission("visitor@example.com")),
    (error: unknown) => error instanceof AdminError && error.code === "already_registered",
  );
  const result = await loadRegistrations(db, administrator);
  assert.equal(result.total, 1);
  assert.equal(result.registrations[0].partySize, 2);
  await assert.rejects(
    loadRegistrations(db, { ...administrator, role: "publisher" }),
    (error: unknown) => error instanceof AdminError && error.status === 403,
  );
});

test("capacity is enforced and cancelled places can be reused", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  addEvent(db, 3);
  await createEventRegistration(db, submission("first@example.com", 2));
  await assert.rejects(
    createEventRegistration(db, submission("second@example.com", 2)),
    (error: unknown) => error instanceof AdminError && error.code === "event_full",
  );
  let first = (await loadRegistrations(db, administrator)).registrations[0];
  await updateRegistration(db, administrator, {
    action: "status",
    id: first.id,
    status: "cancelled",
    internalNote: "Visitor cancelled.",
    updatedAt: first.updatedAt,
  });
  await createEventRegistration(db, submission("second@example.com", 2));
  first = (await loadRegistrations(db, administrator)).registrations.find(
    (item) => item.email === "first@example.com",
  )!;
  await assert.rejects(
    updateRegistration(db, administrator, {
      action: "status",
      id: first.id,
      status: "registered",
      internalNote: "",
      updatedAt: first.updatedAt,
    }),
    (error: unknown) => error instanceof AdminError && error.code === "event_full",
  );
});

test("CSV export prevents spreadsheet formulas", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  addEvent(db, null);
  await createEventRegistration(db, { ...submission("safe@example.com"), fullName: "=FORMULA" });
  const csv = await exportRegistrationsCsv(db, administrator);
  assert.match(csv, /"'=FORMULA"/);
  assert.match(csv, /Registration Test/);
});
