import assert from "node:assert/strict";
import { test } from "node:test";
import { AdminError, type AdminUser } from "../src/lib/auth/permissions.ts";
import { loadAdminLeaders, saveLeader } from "../src/lib/leadership/repository.server.ts";
import { TestDatabase } from "./d1-test-adapter.ts";

const administrator: AdminUser = {
  id: "initial-administrator",
  email: "mortalerror@gmail.com",
  role: "administrator",
};

const profile = {
  name: "Test Leader",
  role: "Ministry Coordinator",
  bio: "Coordinates a ministry and helps newcomers find their next step.",
  email: "leader@example.org",
  phone: null,
  facebook_url: null,
  instagram_url: null,
  linkedin_url: null,
  photo_alt: null,
  remove_photo: false,
  display_order: 30,
  status: "draft" as const,
};

test("leadership migration preserves names without placeholder contacts", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const result = await loadAdminLeaders(db);
  assert.equal(result.leaders.length, 2);
  assert.deepEqual(
    result.leaders.map((leader) => leader.name),
    ["Rt. Rev. Dr. Felix Orji", "Ven. Dr. Isaac Ifedayo Olasehinde"],
  );
  assert.ok(result.leaders.every((leader) => leader.email === null));
  assert.ok(result.leaders.every((leader) => leader.facebook_url === null));
});

test("editors may draft leadership profiles but cannot publish them", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const editor = { ...administrator, role: "editor" as const };
  const created = await saveLeader(db, editor, { action: "save-leader", leader: profile }, null);
  const saved = (await loadAdminLeaders(db)).leaders.find((leader) => leader.id === created.id)!;
  assert.equal(saved.slug, "test-leader");
  await assert.rejects(
    saveLeader(
      db,
      editor,
      {
        action: "save-leader",
        id: saved.id,
        revision: saved.revision,
        leader: { ...profile, status: "published" },
      },
      null,
    ),
    (error: unknown) => error instanceof AdminError && error.status === 403,
  );
});

test("administrators can publish verified optional contact details", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const created = await saveLeader(
    db,
    administrator,
    { action: "save-leader", leader: { ...profile, status: "published" } },
    null,
  );
  const saved = (await loadAdminLeaders(db)).leaders.find((leader) => leader.id === created.id)!;
  assert.equal(saved.status, "published");
  assert.equal(saved.email, "leader@example.org");
  assert.ok(saved.published_at);
});

test("leadership profiles reject insecure social links", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  await assert.rejects(
    saveLeader(
      db,
      administrator,
      {
        action: "save-leader",
        leader: { ...profile, facebook_url: "http://facebook.com/example" },
      },
      null,
    ),
    (error: unknown) => error instanceof Error,
  );
});
