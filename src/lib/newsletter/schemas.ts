import { z } from "zod";
import { NEWSLETTER_TEMPLATE_IDS } from "./templates.ts";

export const NEWSLETTER_CONSENT_VERSION = "2026-09-05";

export const newsletterSignupSchema = z
  .object({
    name: z.string().trim().max(120).default(""),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    consent: z.literal(true),
    website: z.string().max(200).default(""),
    startedAt: z.number().int().positive(),
  })
  .strict();

export const newsletterStatusSchema = z
  .object({
    id: z.string().uuid(),
    status: z.enum(["subscribed", "unsubscribed"]),
  })
  .strict();

export const deliveryProviderSchema = z.enum(["disabled", "kit", "sender"]);
export type DeliveryProvider = z.infer<typeof deliveryProviderSchema>;
export const newsletterTemplateSchema = z.enum(NEWSLETTER_TEMPLATE_IDS);
export type NewsletterTemplateId = z.infer<typeof newsletterTemplateSchema>;

export const newsletterAdminMutationSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("subscriber-status"),
      id: z.string().uuid(),
      status: z.enum(["subscribed", "unsubscribed"]),
    })
    .strict(),
  z
    .object({
      action: z.literal("delivery-provider"),
      provider: deliveryProviderSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("newsletter-template"),
      template: newsletterTemplateSchema,
    })
    .strict(),
  z.object({ action: z.literal("event-workflow"), enabled: z.boolean() }).strict(),
]);

export const newsletterSyncSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("sync") }).strict(),
  z.object({ action: z.literal("reconcile") }).strict(),
  z.object({ action: z.literal("deliver-campaign"), id: z.string().uuid() }).strict(),
]);

export type NewsletterSubscriber = {
  id: string;
  email: string;
  name: string;
  status: "subscribed" | "unsubscribed";
  consent_at: string;
  source: string;
  updated_at: string;
};

export type NewsletterDelivery = {
  activeProvider: DeliveryProvider;
  activeTemplate: NewsletterTemplateId;
  providers: Record<"kit" | "sender", { configured: boolean }>;
  sync: {
    synced: number;
    pending: number;
    errors: number;
    lastAttemptAt: string | null;
    lastReconciledAt: string | null;
  };
  automation: {
    enabled: boolean;
    schedule: "daily";
    lastRunAt: string | null;
    lastError: string | null;
  };
  workflow: {
    enabled: boolean;
    schedule: "every-five-minutes";
    queued: number;
    failed: number;
    lastRunAt: string | null;
    lastError: string | null;
  };
};

export type NewsletterCampaign = {
  id: string;
  eventId: string;
  slug: string;
  templateId: NewsletterTemplateId;
  subject: string;
  provider: Exclude<DeliveryProvider, "disabled"> | null;
  status: "queued" | "creating" | "draft" | "sending" | "sent" | "failed";
  attempts: number;
  sendAfter: string;
  lastAttemptAt: string | null;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
};
