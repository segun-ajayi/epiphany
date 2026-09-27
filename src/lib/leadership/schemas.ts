import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).nullable();
const optionalEmail = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().trim().toLowerCase().email().max(254).nullable(),
);
const optionalHttpsUrl = z.preprocess(
  (value) => (value === "" ? null : value),
  z
    .string()
    .trim()
    .url()
    .max(500)
    .refine((value) => new URL(value).protocol === "https:", "Use a secure https:// URL.")
    .nullable(),
);

export const leaderInputSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    role: z.string().trim().min(2).max(160),
    bio: z.string().trim().max(3000),
    email: optionalEmail,
    phone: optionalText(40),
    facebook_url: optionalHttpsUrl,
    instagram_url: optionalHttpsUrl,
    linkedin_url: optionalHttpsUrl,
    photo_alt: optionalText(240),
    remove_photo: z.boolean(),
    display_order: z.number().int().min(0).max(10000),
    status: z.enum(["draft", "published", "archived"]),
  })
  .strict();

export const saveLeaderSchema = z
  .object({
    action: z.literal("save-leader"),
    id: z.string().uuid().optional(),
    revision: z.number().int().positive().optional(),
    leader: leaderInputSchema,
  })
  .strict();

export type LeaderInput = z.infer<typeof leaderInputSchema>;
export type AdminLeader = Omit<LeaderInput, "remove_photo"> & {
  id: string;
  slug: string;
  photo_path: string | null;
  published_at: string | null;
  revision: number;
};

export type PublicLeader = {
  id: string;
  name: string;
  role: string;
  bio: string;
  email: string | null;
  phone: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  photo: string | null;
  photoAlt: string;
};
