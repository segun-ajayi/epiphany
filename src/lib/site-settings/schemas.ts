import { z } from "zod";

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const optionalText = (max: number) => z.string().trim().max(max);
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => !value || /^https:\/\//i.test(value), "Use a secure https:// URL.");
const localAssetPath = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => /^\/(?!\/)[A-Za-z0-9_./~-]+$/.test(value) && !value.includes(".."),
    "Choose a local website image path.",
  );
const editableImagePath = z.union([z.literal(""), localAssetPath]);

export const editableContentItemSchema = z
  .object({
    id: z.string().uuid(),
    title: text(1, 160),
    body: text(1, 2000),
  })
  .strict();

export const historyItemSchema = z
  .object({
    id: z.string().uuid(),
    year: text(1, 30),
    title: text(1, 160),
    body: text(1, 2000),
  })
  .strict();

export const faqItemSchema = z
  .object({
    id: z.string().uuid(),
    question: text(1, 240),
    answer: text(1, 2000),
  })
  .strict();

export const testimonialSchema = z
  .object({
    id: z.string().uuid(),
    name: text(1, 160),
    quote: text(1, 1200),
  })
  .strict();

export const homeContentSchema = z
  .object({
    heroImagePath: editableImagePath,
    heroIntro: text(1, 600),
    welcomeEyebrow: text(1, 120),
    welcomeTitle: text(1, 240),
    welcomeBody: text(1, 12000),
    welcomeName: text(1, 160),
    welcomeRole: text(1, 240),
    welcomeImagePath: editableImagePath,
    servicesEyebrow: text(1, 120),
    servicesTitle: text(1, 240),
    servicesIntro: text(1, 600),
    ministriesEyebrow: text(1, 120),
    ministriesTitle: text(1, 240),
    eventsEyebrow: text(1, 120),
    eventsTitle: text(1, 240),
    sermonsEyebrow: text(1, 120),
    sermonsTitle: text(1, 240),
    givingEyebrow: text(1, 120),
    givingTitle: text(1, 240),
    givingBody: text(1, 1200),
    testimonialsEyebrow: text(1, 120),
    testimonialsTitle: text(1, 240),
    testimonials: z.array(testimonialSchema).max(12),
  })
  .strict();

export const aboutContentSchema = z
  .object({
    heroEyebrow: text(1, 120),
    heroTitle: text(1, 240),
    heroSubtitle: text(1, 600),
    heroImagePath: editableImagePath,
    missionTitle: text(1, 240),
    missionBody: text(1, 2000),
    visionTitle: text(1, 240),
    visionBody: text(1, 2000),
    historyTitle: text(1, 240),
    history: z.array(historyItemSchema).min(1).max(30),
    beliefsTitle: text(1, 240),
    beliefsIntro: text(1, 2000),
    beliefs: z.array(editableContentItemSchema).min(1).max(20),
  })
  .strict();

export const visitContentSchema = z
  .object({
    heroEyebrow: text(1, 120),
    heroTitle: text(1, 240),
    heroSubtitle: text(1, 600),
    heroImagePath: editableImagePath,
    introEyebrow: text(1, 120),
    introTitle: text(1, 240),
    introBody: text(1, 3000),
    expectationsTitle: text(1, 240),
    expectations: z.array(z.string().trim().min(1).max(2000)).min(1).max(12),
    faqTitle: text(1, 240),
    faqs: z.array(faqItemSchema).min(1).max(20),
    closingTitle: text(1, 240),
    closingBody: text(1, 1000),
  })
  .strict();

export const pageHeroSchema = z
  .object({
    eyebrow: text(1, 120),
    title: text(1, 240),
    subtitle: optionalText(600),
    imagePath: editableImagePath,
  })
  .strict();

export const publicPageContentSchema = z
  .object({
    ministries: pageHeroSchema,
    events: pageHeroSchema,
    sermons: pageHeroSchema,
    gallery: pageHeroSchema,
    contact: pageHeroSchema,
    give: pageHeroSchema,
  })
  .strict();

export const serviceTimeSchema = z
  .object({
    id: z.string().uuid(),
    day: text(1, 40),
    time: text(1, 40),
    title: text(1, 120),
    description: optionalText(500),
  })
  .strict();

export const siteSettingsSchema = z
  .object({
    churchName: text(1, 160),
    shortName: text(1, 160),
    tagline: text(1, 300),
    addressLine1: text(1, 200),
    addressLine2: optionalText(120),
    city: text(1, 100),
    region: text(1, 100),
    postalCode: text(1, 30),
    countryCode: z
      .string()
      .trim()
      .length(2)
      .transform((value) => value.toUpperCase()),
    phone: text(1, 50),
    email: z.string().trim().email().max(254),
    facebookUrl: optionalUrl,
    instagramUrl: optionalUrl,
    youtubeUrl: optionalUrl,
    visitorParking: optionalText(1000),
    visitorChildren: optionalText(1000),
    visitorAccessibility: optionalText(1000),
    visitorServiceDuration: optionalText(300),
    defaultSeoTitle: text(1, 160),
    defaultSeoDescription: text(1, 320),
    socialImagePath: localAssetPath,
    logoImagePath: editableImagePath,
    footerQuote: text(1, 500),
    serviceTimes: z.array(serviceTimeSchema).min(1).max(12),
    home: homeContentSchema,
    about: aboutContentSchema,
    visit: visitContentSchema,
    pages: publicPageContentSchema,
    revision: z.number().int().positive(),
  })
  .strict();

export const siteSettingsMutationSchema = z
  .object({ action: z.literal("save-settings"), settings: siteSettingsSchema })
  .strict();

export type SiteSettings = z.output<typeof siteSettingsSchema>;
export type ServiceTime = z.output<typeof serviceTimeSchema>;
export type EditableContentItem = z.output<typeof editableContentItemSchema>;
export type HistoryItem = z.output<typeof historyItemSchema>;
export type FaqItem = z.output<typeof faqItemSchema>;
export type Testimonial = z.output<typeof testimonialSchema>;

export function formatSiteAddress(settings: SiteSettings) {
  return [
    settings.addressLine1,
    settings.addressLine2,
    settings.city,
    settings.region,
    settings.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}
