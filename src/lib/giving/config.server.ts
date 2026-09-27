import { getAuthSetting } from "../db/runtime.server.ts";
import {
  givingSettingsSchema,
  type GivingDesignation,
  type GivingImpactItem,
  type GivingMethod,
  type GivingSettings,
} from "./schemas.ts";

const value = (request: Request, name: Parameters<typeof getAuthSetting>[1]) =>
  getAuthSetting(request, name)?.trim() ?? "";

const enabled = (input: string) => ["1", "true", "yes", "on"].includes(input.toLowerCase());

function environmentMethod(
  request: Request,
  id: GivingMethod["id"],
  missing: string[],
): GivingMethod {
  const isZelle = id === "zelle";
  const requested = enabled(
    value(request, isZelle ? "GIVING_ZELLE_ENABLED" : "GIVING_CASHAPP_ENABLED"),
  );
  const paymentIdentifier = value(request, isZelle ? "GIVING_ZELLE_ID" : "GIVING_CASHAPP_CASHTAG");
  const recipientName = value(
    request,
    isZelle ? "GIVING_ZELLE_RECIPIENT_NAME" : "GIVING_CASHAPP_RECIPIENT_NAME",
  );
  const externalUrl = isZelle ? "" : value(request, "GIVING_CASHAPP_URL");
  if (requested && !paymentIdentifier)
    missing.push(`${isZelle ? "Zelle" : "Cash App"} payment identifier`);
  if (requested && !recipientName)
    missing.push(`${isZelle ? "Zelle" : "Cash App"} verified recipient name`);
  if (requested && !isZelle && !externalUrl) missing.push("Cash App approved HTTPS URL");
  return {
    id,
    enabled: requested && Boolean(paymentIdentifier && recipientName && (isZelle || externalUrl)),
    paymentIdentifier,
    recipientName,
    instructions:
      value(request, isZelle ? "GIVING_ZELLE_INSTRUCTIONS" : "GIVING_CASHAPP_INSTRUCTIONS") ||
      (isZelle
        ? "Open Zelle in your bank app and send your gift to the address shown here."
        : "Open Cash App using the secure link and confirm the recipient before sending."),
    memoGuidance: value(
      request,
      isZelle ? "GIVING_ZELLE_MEMO_GUIDANCE" : "GIVING_CASHAPP_MEMO_GUIDANCE",
    ),
    externalUrl,
    qrImagePath: value(request, isZelle ? "GIVING_ZELLE_QR_PATH" : "GIVING_CASHAPP_QR_PATH"),
  };
}

function environmentDesignations(request: Request): GivingDesignation[] {
  const labels = value(request, "GIVING_DESIGNATIONS")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
  return labels.map((label, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    label,
    description: "",
    enabled: true,
  }));
}

function environmentImpactItems(request: Request): GivingImpactItem[] {
  const items: GivingImpactItem[] = [];
  for (const index of [1, 2, 3] as const) {
    const amount = value(request, `GIVING_IMPACT_${index}_AMOUNT`);
    const statement = value(request, `GIVING_IMPACT_${index}_TEXT`);
    const parsed = Number(amount);
    if (!statement || !Number.isFinite(parsed) || parsed <= 0) continue;
    items.push({
      id: `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      amountCents: Math.round(parsed * 100),
      statement,
      evidenceNote: value(request, `GIVING_IMPACT_${index}_EVIDENCE`),
      enabled: true,
      reviewedAt: value(request, `GIVING_IMPACT_${index}_REVIEWED_AT`) || null,
    });
  }
  return items;
}

export function getEnvironmentGivingSettings(request: Request) {
  const setupRequired: string[] = [];
  const publicName =
    value(request, "GIVING_PUBLIC_NAME") || "Anglican Church of the Epiphany, Houston";
  const trustStatement =
    value(request, "GIVING_TRUST_STATEMENT") ||
    "The website does not collect payment details. Complete your gift in your bank or payment app and confirm the recipient before sending.";
  const receiptsRequested = enabled(value(request, "GIVING_RECEIPTS_ENABLED"));
  const supportEmail = value(request, "GIVING_SUPPORT_EMAIL");
  const receiptConsentText = value(request, "GIVING_RECEIPT_CONSENT_TEXT");
  const retentionText = value(request, "GIVING_RETENTION_TEXT");
  if (receiptsRequested && !supportEmail) setupRequired.push("receipt support email");
  if (receiptsRequested && !receiptConsentText) setupRequired.push("receipt consent wording");
  if (receiptsRequested && !retentionText) setupRequired.push("receipt retention wording");
  const methods = [
    environmentMethod(request, "zelle", setupRequired),
    environmentMethod(request, "cash_app", setupRequired),
  ];
  if (!methods.some((method) => method.enabled)) setupRequired.push("at least one verified method");
  const settings: GivingSettings = givingSettingsSchema.parse({
    publicName,
    legalName: value(request, "GIVING_LEGAL_NAME"),
    taxStatusText: value(request, "GIVING_TAX_STATUS_TEXT"),
    publicEin: value(request, "GIVING_PUBLIC_EIN"),
    supportEmail,
    supportPhone: value(request, "GIVING_SUPPORT_PHONE"),
    receiptTurnaround: value(request, "GIVING_RECEIPT_TURNAROUND"),
    trustStatement,
    offlineInstructions: value(request, "GIVING_OFFLINE_INSTRUCTIONS"),
    annualReportUrl: value(request, "GIVING_ANNUAL_REPORT_URL"),
    socialImagePath: value(request, "GIVING_SOCIAL_IMAGE_PATH"),
    privacyText: value(request, "GIVING_PRIVACY_TEXT"),
    receiptConsentText,
    retentionText,
    receiptsEnabled:
      receiptsRequested && Boolean(supportEmail && receiptConsentText && retentionText),
    simulationMode: enabled(value(request, "GIVING_SIMULATION_MODE")),
    methods,
    designations: environmentDesignations(request),
    impactItems: environmentImpactItems(request),
    revision: 1,
  });
  return { settings, setupRequired: [...new Set(setupRequired)] };
}
