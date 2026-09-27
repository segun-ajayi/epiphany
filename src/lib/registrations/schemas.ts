import { z } from "zod";

export const REGISTRATION_STATUSES = ["registered", "cancelled", "attended"] as const;

export const eventRegistrationSchema = z
  .object({
    eventSlug: z.string().trim().min(1).max(160),
    fullName: z.string().trim().min(2).max(160),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z.string().trim().max(40),
    partySize: z.coerce.number().int().min(1).max(20),
    note: z.string().trim().max(1000),
    consent: z.literal(true),
    website: z.string().max(200).default(""),
    startedAt: z.number().int().positive(),
  })
  .strict();

export const registrationAdminMutationSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("status"),
      id: z.string().uuid(),
      status: z.enum(REGISTRATION_STATUSES),
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

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];
export type EventRegistration = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  eventStartsAt: string;
  fullName: string;
  email: string;
  phone: string;
  partySize: number;
  note: string;
  consentAt: string;
  status: RegistrationStatus;
  internalNote: string;
  createdAt: string;
  updatedAt: string;
};
