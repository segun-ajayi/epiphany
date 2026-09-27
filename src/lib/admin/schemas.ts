import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);
const optionalEmail = z
  .union([z.literal(""), z.string().trim().email().max(254)])
  .nullish()
  .transform((v) => v || null);
const assetPath = optionalText(500).refine(
  (value) => !value || (/^\/(?!\/)[A-Za-z0-9_./~-]+$/.test(value) && !value.includes("..")),
  "Choose a deployed local asset path, such as /media/photo.jpg.",
);
const optionalHttpsUrl = z
  .union([z.literal(""), z.string().trim().url().max(1000)])
  .nullish()
  .transform((value) => value || null)
  .refine((value) => !value || value.startsWith("https://"), "Use a secure https:// URL.");
const optionalYouTubeUrl = optionalHttpsUrl.refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return Boolean(url.pathname.split("/").filter(Boolean)[0]);
    if (host !== "youtube.com") return false;
    return Boolean(
      url.searchParams.get("v") ||
      (/^\/(embed|shorts|live)\/[A-Za-z0-9_-]+/.test(url.pathname)
        ? url.pathname.split("/")[2]
        : null),
    );
  } catch {
    return false;
  }
}, "Use a YouTube or youtu.be URL.");
const optionalResourceUrl = z
  .union([z.literal(""), z.string().trim().max(1000)])
  .nullish()
  .transform((value) => value || null)
  .refine(
    (value) =>
      !value ||
      value.startsWith("https://") ||
      (/^\/(?!\/)[A-Za-z0-9_./~-]+$/.test(value) && !value.includes("..")),
    "Use a secure URL or a deployed local file path.",
  );
const utcDate = z
  .string()
  .datetime({ offset: true })
  .transform((v) => new Date(v).toISOString());
const optionalDate = z
  .union([z.literal(""), utcDate])
  .nullish()
  .transform((v) => v || null);
const common = {
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  summary: z.string().trim().max(600),
  description: z.string().trim().max(30000),
  status: z.enum(["draft", "published", "archived"]),
  published_at: optionalDate,
  image_path: assetPath,
  image_alt: optionalText(300),
  seo_title: optionalText(160),
  seo_description: optionalText(320),
  social_image_path: assetPath,
};

function validatePublication(
  value: {
    status: string;
    summary: string;
    description: string;
    image_path?: string | null;
    image_alt?: string | null;
  },
  context: z.RefinementCtx,
) {
  if (value.status !== "published") return;
  for (const field of ["summary", "description"] as const) {
    if (!value[field])
      context.addIssue({ code: "custom", path: [field], message: "Required before publishing." });
  }
  if (value.image_path && !value.image_alt)
    context.addIssue({
      code: "custom",
      path: ["image_alt"],
      message: "Describe the image before publishing.",
    });
}

export const ministrySchema = z
  .object({
    ...common,
    name: z.string().trim().min(1).max(160),
    meeting_schedule: optionalText(500),
    meeting_location: optionalText(300),
    leader_name: optionalText(160),
    leader_title: optionalText(160),
    contact_email: optionalEmail,
    contact_phone: optionalText(40),
    audience: optionalText(300),
    what_to_expect: optionalText(3000),
    join_instructions: optionalText(3000),
    display_order: z.coerce.number().int().min(0).max(100000),
  })
  .strict()
  .superRefine(validatePublication);

export const eventSchema = z
  .object({
    ...common,
    title: z.string().trim().min(1).max(200),
    category: z.enum(["Worship", "Fellowship", "Outreach", "Youth", "Bible Study"]),
    starts_at: utcDate,
    ends_at: optionalDate,
    timezone: z
      .string()
      .max(100)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat("en-US", { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }, "Use a valid timezone, such as America/Chicago."),
    venue_name: optionalText(300),
    address_line_1: optionalText(300),
    address_line_2: optionalText(300),
    locality: optionalText(160),
    region: optionalText(160),
    postal_code: optionalText(40),
    country_code: z
      .string()
      .length(2)
      .regex(/^[A-Z]{2}$/),
    registration_status: z.enum(["not_required", "open", "closed", "full"]),
    capacity: z.preprocess(
      (v) => (v === "" || v === undefined ? null : v),
      z.coerce.number().int().min(1).max(100000).nullable(),
    ),
    contact_name: optionalText(160),
    contact_email: optionalEmail,
    status: z.enum(["draft", "published", "cancelled", "archived"]),
  })
  .strict()
  .superRefine((value, context) => {
    validatePublication(value, context);
    if (value.ends_at && value.ends_at < value.starts_at)
      context.addIssue({
        code: "custom",
        path: ["ends_at"],
        message: "End must be after the start.",
      });
    if (value.status === "published" && !value.venue_name)
      context.addIssue({
        code: "custom",
        path: ["venue_name"],
        message: "A venue is required before publishing.",
      });
  });

export const sermonSchema = z
  .object({
    ...common,
    title: z.string().trim().min(1).max(200),
    speaker: z.string().trim().min(1).max(160),
    sermon_date: z.string().date(),
    scripture: z.string().trim().min(1).max(300),
    series: optionalText(160),
    topic: optionalText(160),
    youtube_url: optionalYouTubeUrl,
    audio_url: optionalHttpsUrl,
    notes_url: optionalResourceUrl,
    duration_seconds: z.preprocess(
      (value) => (value === "" || value === undefined ? null : value),
      z.coerce.number().int().min(1).max(86400).nullable(),
    ),
  })
  .strict()
  .superRefine((value, context) => {
    validatePublication(value, context);
    if (value.status === "published" && !value.youtube_url && !value.audio_url)
      context.addIssue({
        code: "custom",
        path: ["youtube_url"],
        message: "Add a YouTube or audio URL before publishing.",
      });
  });

export type MinistryInput = z.output<typeof ministrySchema>;
export type EventInput = z.output<typeof eventSchema>;
export type SermonInput = z.output<typeof sermonSchema>;
export type ContentKind = "ministry" | "event" | "sermon";
export type RecordMetadata = {
  id: string;
  revision: number;
  created_at: string;
  updated_at: string;
};
export type AdminMinistry = MinistryInput & RecordMetadata;
export type AdminEvent = EventInput & RecordMetadata;
export type AdminSermon = SermonInput & RecordMetadata;

export const saveEnvelopeSchema = z
  .object({
    kind: z.enum(["ministry", "event", "sermon"]),
    id: z.string().min(1).max(160).optional(),
    revision: z.number().int().positive().optional(),
    newsletterQueued: z.boolean().optional(),
    remove_image: z.boolean().optional().default(false),
    remove_notes: z.boolean().optional().default(false),
    record: z.unknown(),
  })
  .strict();
