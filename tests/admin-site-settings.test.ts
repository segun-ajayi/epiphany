import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminUser } from "../src/lib/auth/permissions.ts";
import { DEFAULT_SITE_SETTINGS } from "../src/lib/site-settings/defaults.ts";
import {
  loadSiteSettings,
  loadSiteSettingsAdmin,
  saveSiteSettings,
} from "../src/lib/site-settings/repository.server.ts";
import { siteSettingsSchema } from "../src/lib/site-settings/schemas.ts";
import { TestDatabase } from "./d1-test-adapter.ts";

const administrator: AdminUser = {
  id: "initial-administrator",
  email: "mortalerror@gmail.com",
  role: "administrator",
};

test("site settings use safe defaults and persist portable administrator updates", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const defaults = await loadSiteSettings(db);
  assert.equal(defaults.churchName, DEFAULT_SITE_SETTINGS.churchName);
  assert.equal(defaults.facebookUrl, "");

  const result = await saveSiteSettings(db, administrator, {
    action: "save-settings",
    settings: {
      ...defaults,
      tagline: "A locally managed public tagline",
      visitorParking: "Use the marked visitor spaces near the entrance.",
      facebookUrl: "https://www.facebook.com/example-church",
    },
  });
  assert.equal(result.revision, 2);
  const saved = await loadSiteSettings(db);
  assert.equal(saved.tagline, "A locally managed public tagline");
  assert.equal(saved.revision, 2);
  assert.equal(
    db.sqlite.prepare("SELECT action FROM audit_log ORDER BY rowid DESC").get()?.action,
    "site.settings",
  );
});

test("site settings reject non-administrators, stale writes and unsafe URLs", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  await assert.rejects(
    loadSiteSettingsAdmin(db, { ...administrator, role: "publisher" }),
    (error: unknown) =>
      !!error && typeof error === "object" && "status" in error && error.status === 403,
  );
  const defaults = await loadSiteSettings(db);
  await saveSiteSettings(db, administrator, {
    action: "save-settings",
    settings: defaults,
  });
  await assert.rejects(
    saveSiteSettings(db, administrator, {
      action: "save-settings",
      settings: defaults,
    }),
    (error: unknown) =>
      !!error && typeof error === "object" && "status" in error && error.status === 409,
  );
  assert.equal(
    siteSettingsSchema.safeParse({ ...defaults, facebookUrl: "http://example.test" }).success,
    false,
  );
  assert.equal(
    siteSettingsSchema.safeParse({ ...defaults, socialImagePath: "/media/../secret" }).success,
    false,
  );
});

test("legacy settings gain new managed page content without losing saved values", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const {
    revision: _revision,
    home: _home,
    about: _about,
    visit: _visit,
    pages: _pages,
    ...legacy
  } = DEFAULT_SITE_SETTINGS;
  db.sqlite
    .prepare(
      `INSERT INTO site_settings (id, settings_json, revision, updated_at, updated_by)
       VALUES (1, ?, 4, ?, ?)`,
    )
    .run(
      JSON.stringify({ ...legacy, tagline: "A retained legacy tagline" }),
      new Date().toISOString(),
      administrator.id,
    );

  const loaded = await loadSiteSettings(db);
  assert.equal(loaded.tagline, "A retained legacy tagline");
  assert.equal(loaded.revision, 4);
  assert.equal(loaded.home.welcomeName, DEFAULT_SITE_SETTINGS.home.welcomeName);
  assert.equal(loaded.about.history.length, DEFAULT_SITE_SETTINGS.about.history.length);
  assert.equal(loaded.pages.events.title, DEFAULT_SITE_SETTINGS.pages.events.title);
});
