import assert from "node:assert/strict";
import { test } from "node:test";
import { AdminError, type AdminUser } from "../src/lib/auth/permissions.ts";
import type { UploadedImage } from "../src/lib/admin/media.server.ts";
import {
  addGalleryPhoto,
  loadAdminGallery,
  mutateGalleryPhoto,
  saveGalleryAlbum,
} from "../src/lib/gallery/repository.server.ts";
import { TestDatabase } from "./d1-test-adapter.ts";

const admin: AdminUser = {
  id: "initial-administrator",
  email: "mortalerror@gmail.com",
  role: "administrator",
};

const album = (status: "draft" | "published" | "archived" = "draft") => ({
  action: "save-album" as const,
  album: {
    title: "Parish Picnic",
    summary: "Photographs from our parish picnic and fellowship.",
    description: "The congregation gathered for worship, food, games, and fellowship.",
    event_date: "2026-09-20",
    related_event_slug: null,
    related_ministry_slug: null,
    status,
    display_order: 0,
    seo_title: null,
    seo_description: null,
    published_at: status === "published" ? "2026-09-24T12:00:00.000Z" : null,
  },
});

const image: UploadedImage = {
  id: "8b489799-584f-4dab-8a49-7d09d0c75009",
  contentType: "image/jpeg",
  bytes: Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]).buffer,
  byteSize: 4,
};

const thumbnail: UploadedImage = {
  id: "5a5cc562-9c50-4768-acd7-eaa0c117f9b1",
  contentType: "image/webp",
  bytes: Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]).buffer,
  byteSize: 12,
};

test("gallery albums require a photo before publication and preserve their permanent URL", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());

  const created = await saveGalleryAlbum(db, admin, album());
  assert.equal(created.slug, "parish-picnic");
  await assert.rejects(
    saveGalleryAlbum(db, admin, { ...album("published"), id: created.id, revision: 1 }),
    (error: unknown) => error instanceof AdminError && error.code === "photo_required",
  );

  await addGalleryPhoto(
    db,
    admin,
    created.id,
    "Families sharing a meal outdoors",
    "Parish picnic lunch",
    image,
    thumbnail,
    1200,
    800,
  );
  const published = await saveGalleryAlbum(db, admin, {
    ...album("published"),
    id: created.id,
    revision: 1,
  });
  assert.equal(published.slug, "parish-picnic");

  const gallery = await loadAdminGallery(db);
  assert.equal(gallery.albums.length, 1);
  assert.equal(gallery.albums[0].photo_count, 1);
  assert.equal(gallery.albums[0].photos[0].featured, 1);
  assert.equal(gallery.albums[0].photos[0].image_alt, "Families sharing a meal outdoors");
});

test("gallery photo details update and removal also removes uploaded media", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  const created = await saveGalleryAlbum(db, admin, album());
  await addGalleryPhoto(
    db,
    admin,
    created.id,
    "A picnic photograph",
    null,
    image,
    thumbnail,
    1200,
    800,
  );
  const photo = (await loadAdminGallery(db)).albums[0].photos[0];

  await mutateGalleryPhoto(db, admin, {
    action: "update-photo",
    id: photo.id,
    revision: photo.revision,
    image_alt: "Children playing games at the picnic",
    caption: "Games on the church lawn",
    display_order: 3,
    featured: true,
  });
  const updated = (await loadAdminGallery(db)).albums[0].photos[0];
  assert.equal(updated.caption, "Games on the church lawn");
  assert.equal(updated.display_order, 3);

  await mutateGalleryPhoto(db, admin, {
    action: "remove-photo",
    id: updated.id,
    revision: updated.revision,
  });
  assert.equal((await loadAdminGallery(db)).albums[0].photo_count, 0);
  assert.equal(
    db.sqlite.prepare("SELECT COUNT(*) AS total FROM media_assets WHERE id = ?").get(image.id)
      ?.total,
    0,
  );
  assert.equal(
    db.sqlite.prepare("SELECT COUNT(*) AS total FROM media_assets WHERE id = ?").get(thumbnail.id)
      ?.total,
    0,
  );
});

test("gallery relationships require safe permanent URL names", async (t) => {
  const db = new TestDatabase();
  t.after(() => db.close());
  await assert.rejects(
    saveGalleryAlbum(db, admin, {
      ...album(),
      album: { ...album().album, related_event_slug: "invalid event name" },
    }),
    (error: unknown) => error instanceof Error,
  );
});
