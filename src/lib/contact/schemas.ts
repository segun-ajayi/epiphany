import { z } from "zod";

export const CONTACT_TOPICS = ["general", "visit", "ministry", "prayer", "pastoral"] as const;
export const CONTACT_STATUSES = ["new", "read", "resolved"] as const;

export const contactSubmissionSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z.string().trim().max(40),
    topic: z.enum(CONTACT_TOPICS),
    subject: z.string().trim().max(160),
    message: z.string().trim().min(10).max(5000),
    consent: z.literal(true),
    website: z.string().max(200).default(""),
    startedAt: z.number().int().positive(),
  })
  .strict();

export const contactAdminMutationSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("status"),
      id: z.string().uuid(),
      status: z.enum(CONTACT_STATUSES),
      internalNote: z.string().trim().max(1000),
      updatedAt: z.string().datetime({ offset: true }),
    })
    .strict(),
  z
    .object({
      action: z.literal("delete"),
      id: z.string().uuid(),
      updatedAt: z.string().datetime({ offset: true }),
    })
    .strict(),
]);

export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export type ContactMessage = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  topic: ContactTopic;
  subject: string;
  message: string;
  consentAt: string;
  status: ContactStatus;
  internalNote: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};
