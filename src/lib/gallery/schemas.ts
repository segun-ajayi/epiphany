import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).nullable();

export const galleryAlbumInputSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    summary: z.string().trim().min(10).max(300),
    description: z.string().trim().min(10).max(5000),
    event_date: optionalText(10).refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Use a valid event date.",
    }),
    related_event_slug: optionalText(160).refine(
      (value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
      "Use the event's URL name, such as parish-picnic.",
    ),
    related_ministry_slug: optionalText(160).refine(
      (value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
      "Use the ministry's URL name, such as youth-ministry.",
    ),
    status: z.enum(["draft", "published", "archived"]),
    display_order: z.number().int().min(0).max(10000),
    seo_title: optionalText(70),
    seo_description: optionalText(170),
    published_at: optionalText(30),
  })
  .strict();

export const saveGalleryAlbumSchema = z
  .object({
    action: z.literal("save-album"),
    id: z.string().uuid().optional(),
    revision: z.number().int().positive().optional(),
    album: galleryAlbumInputSchema,
  })
  .strict();

export const updateGalleryPhotoSchema = z
  .object({
    action: z.literal("update-photo"),
    id: z.string().uuid(),
    revision: z.number().int().positive(),
    image_alt: z.string().trim().min(3).max(240),
    caption: optionalText(500),
    display_order: z.number().int().min(0).max(10000),
    featured: z.boolean(),
  })
  .strict();

export const removeGalleryPhotoSchema = z
  .object({
    action: z.literal("remove-photo"),
    id: z.string().uuid(),
    revision: z.number().int().positive(),
  })
  .strict();

export const galleryMutationSchema = z.discriminatedUnion("action", [
  saveGalleryAlbumSchema,
  updateGalleryPhotoSchema,
  removeGalleryPhotoSchema,
]);

export type GalleryAlbumInput = z.infer<typeof galleryAlbumInputSchema>;

export type AdminGalleryPhoto = {
  id: string;
  album_id: string;
  image_path: string;
  thumbnail_path: string | null;
  image_width: number | null;
  image_height: number | null;
  image_alt: string;
  caption: string | null;
  display_order: number;
  featured: number;
  revision: number;
};

export type AdminGalleryAlbum = GalleryAlbumInput & {
  id: string;
  slug: string;
  revision: number;
  photo_count: number;
  photos: AdminGalleryPhoto[];
};
