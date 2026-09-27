import type { SqlDatabase } from "./sql.types.ts";
export type {
  SqlDatabase as D1Database,
  SqlStatement as D1PreparedStatement,
  SqlValue as D1Value,
  SqlResult as D1Result,
} from "./sql.types.ts";

export type CloudflareBindings = {
  DB?: SqlDatabase;
  AUTH_ORIGIN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  KIT_API_KEY?: string;
  KIT_TAG_ID?: string;
  SENDER_API_TOKEN?: string;
  SENDER_GROUP_ID?: string;
  NEWSLETTER_FROM_EMAIL?: string;
  NEWSLETTER_FROM_NAME?: string;
  GIVING_PUBLIC_NAME?: string;
  GIVING_LEGAL_NAME?: string;
  GIVING_TAX_STATUS_TEXT?: string;
  GIVING_PUBLIC_EIN?: string;
  GIVING_SUPPORT_EMAIL?: string;
  GIVING_SUPPORT_PHONE?: string;
  GIVING_RECEIPT_TURNAROUND?: string;
  GIVING_TRUST_STATEMENT?: string;
  GIVING_OFFLINE_INSTRUCTIONS?: string;
  GIVING_ANNUAL_REPORT_URL?: string;
  GIVING_SOCIAL_IMAGE_PATH?: string;
  GIVING_PRIVACY_TEXT?: string;
  GIVING_RECEIPT_CONSENT_TEXT?: string;
  GIVING_RETENTION_TEXT?: string;
  GIVING_RECEIPTS_ENABLED?: string;
  GIVING_SIMULATION_MODE?: string;
  GIVING_ZELLE_ENABLED?: string;
  GIVING_ZELLE_ID?: string;
  GIVING_ZELLE_RECIPIENT_NAME?: string;
  GIVING_ZELLE_INSTRUCTIONS?: string;
  GIVING_ZELLE_MEMO_GUIDANCE?: string;
  GIVING_ZELLE_QR_PATH?: string;
  GIVING_CASHAPP_ENABLED?: string;
  GIVING_CASHAPP_CASHTAG?: string;
  GIVING_CASHAPP_RECIPIENT_NAME?: string;
  GIVING_CASHAPP_INSTRUCTIONS?: string;
  GIVING_CASHAPP_MEMO_GUIDANCE?: string;
  GIVING_CASHAPP_URL?: string;
  GIVING_CASHAPP_QR_PATH?: string;
  GIVING_DESIGNATIONS?: string;
  GIVING_IMPACT_1_AMOUNT?: string;
  GIVING_IMPACT_1_TEXT?: string;
  GIVING_IMPACT_1_EVIDENCE?: string;
  GIVING_IMPACT_1_REVIEWED_AT?: string;
  GIVING_IMPACT_2_AMOUNT?: string;
  GIVING_IMPACT_2_TEXT?: string;
  GIVING_IMPACT_2_EVIDENCE?: string;
  GIVING_IMPACT_2_REVIEWED_AT?: string;
  GIVING_IMPACT_3_AMOUNT?: string;
  GIVING_IMPACT_3_TEXT?: string;
  GIVING_IMPACT_3_EVIDENCE?: string;
  GIVING_IMPACT_3_REVIEWED_AT?: string;
};

export type CloudflareRuntimeRequest = Request & {
  runtime?: {
    name?: string;
    cloudflare?: {
      env?: CloudflareBindings;
      context?: unknown;
    };
  };
};
