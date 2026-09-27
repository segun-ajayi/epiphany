import { z } from "zod";

export const GIVING_METHOD_IDS = ["zelle", "cash_app"] as const;
export const RECEIPT_STATUSES = [
  "submitted",
  "matched",
  "receipt_issued",
  "unable_to_match",
] as const;

const safePath = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) =>
      value === "" ||
      (/^\/(?:media\/[0-9a-f-]{36}|[A-Za-z0-9][A-Za-z0-9._/-]*)$/.test(value) &&
        !value.split("/").includes("..")),
    "Use a same-site image path beginning with /.",
  );

const optionalHttpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || /^https:\/\//i.test(value), "Use a secure HTTPS URL.");

export const givingMethodSchema = z
  .object({
    id: z.enum(GIVING_METHOD_IDS),
    enabled: z.boolean(),
    paymentIdentifier: z.string().trim().max(254),
    recipientName: z.string().trim().max(160),
    instructions: z.string().trim().max(1000),
    memoGuidance: z.string().trim().max(500),
    externalUrl: optionalHttpsUrl,
    qrImagePath: safePath,
  })
  .strict()
  .superRefine((method, context) => {
    if (!method.enabled) return;
    if (!method.paymentIdentifier)
      context.addIssue({
        code: "custom",
        path: ["paymentIdentifier"],
        message: "An enabled method requires a payment identifier.",
      });
    if (!method.recipientName)
      context.addIssue({
        code: "custom",
        path: ["recipientName"],
        message: "An enabled method requires the verified recipient name.",
      });
    if (method.id === "cash_app" && !method.externalUrl)
      context.addIssue({
        code: "custom",
        path: ["externalUrl"],
        message: "Enabled Cash App giving requires its approved HTTPS URL.",
      });
  });

export const givingDesignationSchema = z
  .object({
    id: z.string().uuid(),
    label: z.string().trim().min(1).max(80),
    description: z.string().trim().max(300),
    enabled: z.boolean(),
  })
  .strict();

export const givingImpactSchema = z
  .object({
    id: z.string().uuid(),
    amountCents: z.number().int().min(1).max(100_000_000),
    statement: z.string().trim().min(1).max(300),
    evidenceNote: z.string().trim().max(500),
    enabled: z.boolean(),
    reviewedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict();

export const givingSettingsSchema = z
  .object({
    publicName: z.string().trim().min(1).max(160),
    legalName: z.string().trim().max(200),
    taxStatusText: z.string().trim().max(1000),
    publicEin: z.string().trim().max(40),
    supportEmail: z.union([z.literal(""), z.string().trim().email().max(254)]),
    supportPhone: z.string().trim().max(50),
    receiptTurnaround: z.string().trim().max(300),
    trustStatement: z.string().trim().min(1).max(1000),
    offlineInstructions: z.string().trim().max(1000),
    annualReportUrl: optionalHttpsUrl,
    socialImagePath: safePath,
    privacyText: z.string().trim().max(1000),
    receiptConsentText: z.string().trim().max(1000),
    retentionText: z.string().trim().max(1000),
    receiptsEnabled: z.boolean(),
    simulationMode: z.boolean(),
    methods: z.array(givingMethodSchema).length(2),
    designations: z.array(givingDesignationSchema).max(20),
    impactItems: z.array(givingImpactSchema).max(12),
    revision: z.number().int().positive(),
  })
  .strict()
  .superRefine((settings, context) => {
    const ids = settings.methods.map((method) => method.id);
    if (new Set(ids).size !== 2 || !GIVING_METHOD_IDS.every((id) => ids.includes(id))) {
      context.addIssue({
        code: "custom",
        path: ["methods"],
        message: "Both giving methods are required.",
      });
    }
    if (settings.receiptsEnabled) {
      if (!settings.supportEmail)
        context.addIssue({
          code: "custom",
          path: ["supportEmail"],
          message: "Receipt requests require a support email.",
        });
      if (!settings.receiptConsentText)
        context.addIssue({
          code: "custom",
          path: ["receiptConsentText"],
          message: "Receipt requests require approved consent wording.",
        });
      if (!settings.retentionText)
        context.addIssue({
          code: "custom",
          path: ["retentionText"],
          message: "Receipt requests require an approved retention statement.",
        });
    }
  });

export const receiptRequestSchema = z
  .object({
    donorName: z.string().trim().min(1).max(160),
    donorEmail: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    amount: z
      .string()
      .trim()
      .regex(/^\d{1,7}(?:\.\d{1,2})?$/, "Enter a valid donation amount."),
    paymentMethod: z.enum(GIVING_METHOD_IDS),
    giftDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid donation date."),
    designation: z.string().trim().max(80),
    transactionReference: z.string().trim().max(120),
    note: z.string().trim().max(1000),
    consent: z.literal(true),
    website: z.string().max(200).default(""),
    startedAt: z.number().int().positive(),
  })
  .strict();

export const givingAdminMutationSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("save-settings"),
      settings: givingSettingsSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("receipt-status"),
      id: z.string().uuid(),
      status: z.enum(RECEIPT_STATUSES),
      internalNote: z.string().trim().max(500),
      updatedAt: z.string().datetime({ offset: true }),
    })
    .strict(),
  z
    .object({
      action: z.literal("receipt-delete"),
      id: z.string().uuid(),
      updatedAt: z.string().datetime({ offset: true }),
    })
    .strict(),
]);

export type GivingMethod = z.infer<typeof givingMethodSchema>;
export type GivingDesignation = z.infer<typeof givingDesignationSchema>;
export type GivingImpactItem = z.infer<typeof givingImpactSchema>;
export type GivingSettings = z.infer<typeof givingSettingsSchema>;
export type ReceiptStatus = (typeof RECEIPT_STATUSES)[number];

export type GivingReceiptRequest = {
  id: string;
  donorName: string;
  donorEmail: string;
  amountCents: number;
  paymentMethod: GivingMethod["id"];
  giftDate: string;
  designation: string;
  transactionReference: string;
  note: string;
  consentAt: string;
  status: ReceiptStatus;
  internalNote: string;
  matchedAt: string | null;
  receiptIssuedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicGivingData = {
  configured: boolean;
  setupRequired: string[];
  settings: GivingSettings;
};
