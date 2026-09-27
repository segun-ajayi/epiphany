import { AdminError, type AdminUser } from "../auth/permissions.ts";
import type { SqlDatabase } from "../db/sql.types.ts";
import { mediaPath, type UploadedImage } from "../admin/media.server.ts";
import { getEnvironmentGivingSettings } from "./config.server.ts";
import {
  givingAdminMutationSchema,
  givingSettingsSchema,
  receiptRequestSchema,
  type GivingReceiptRequest,
  type GivingSettings,
  type PublicGivingData,
} from "./schemas.ts";

function assertAdministrator(user: AdminUser) {
  if (user.role !== "administrator")
    throw new AdminError(403, "forbidden", "Only administrators may manage giving settings.");
}

export async function saveGivingQrImage(
  db: SqlDatabase,
  user: AdminUser,
  method: "zelle" | "cash_app",
  image: UploadedImage,
) {
  assertAdministrator(user);
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `INSERT INTO media_assets (id, content_type, body, byte_size, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(image.id, image.contentType, image.bytes, image.byteSize, now, user.id),
    db
      .prepare(
        `INSERT INTO audit_log
          (id, actor_id, action, content_type, record_id, summary, created_at)
         VALUES (?, ?, 'giving.qr-upload', 'giving', ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        user.id,
        method,
        `Uploaded a replacement ${method === "zelle" ? "Zelle" : "Cash App"} QR image.`,
        now,
      ),
  ]);
  return { ok: true as const, path: mediaPath(image.id) };
}

type SettingsRow = {
  configured: number;
  public_name: string;
  legal_name: string;
  tax_status_text: string;
  public_ein: string;
  support_email: string;
  support_phone: string;
  receipt_turnaround: string;
  trust_statement: string;
  offline_instructions: string;
  annual_report_url: string;
  social_image_path: string;
  privacy_text: string;
  receipt_consent_text: string;
  retention_text: string;
  receipts_enabled: number;
  simulation_mode: number;
  revision: number;
};

type MethodRow = {
  id: "zelle" | "cash_app";
  enabled: number;
  payment_identifier: string;
  recipient_name: string;
  instructions: string;
  memo_guidance: string;
  external_url: string;
  qr_image_path: string;
};

async function loadDatabaseSettings(db: SqlDatabase): Promise<GivingSettings | null> {
  const row = await db
    .prepare(
      `SELECT configured, public_name, legal_name, tax_status_text, public_ein, support_email,
              support_phone, receipt_turnaround, trust_statement, offline_instructions,
              annual_report_url, social_image_path, privacy_text, receipt_consent_text, retention_text,
              receipts_enabled, simulation_mode, revision
       FROM giving_settings WHERE id = 1 AND configured = 1`,
    )
    .first<SettingsRow>();
  if (!row) return null;
  const [methods, designations, impacts] = await db.batch([
    db.prepare(
      `SELECT id, enabled, payment_identifier, recipient_name, instructions, memo_guidance,
              external_url, qr_image_path
       FROM giving_methods ORDER BY display_order, id`,
    ),
    db.prepare(
      `SELECT id, label, description, enabled
       FROM giving_designations ORDER BY display_order, label`,
    ),
    db.prepare(
      `SELECT id, amount_cents, statement, evidence_note, enabled, reviewed_at
       FROM giving_impact_items ORDER BY display_order, amount_cents`,
    ),
  ]);
  const methodRows = methods.results as MethodRow[];
  for (const id of ["zelle", "cash_app"] as const) {
    if (!methodRows.some((method) => method.id === id))
      methodRows.push({
        id,
        enabled: 0,
        payment_identifier: "",
        recipient_name: "",
        instructions: "",
        memo_guidance: "",
        external_url: "",
        qr_image_path: "",
      });
  }
  return givingSettingsSchema.parse({
    publicName: row.public_name,
    legalName: row.legal_name,
    taxStatusText: row.tax_status_text,
    publicEin: row.public_ein,
    supportEmail: row.support_email,
    supportPhone: row.support_phone,
    receiptTurnaround: row.receipt_turnaround,
    trustStatement: row.trust_statement,
    offlineInstructions: row.offline_instructions,
    annualReportUrl: row.annual_report_url,
    socialImagePath: row.social_image_path,
    privacyText: row.privacy_text,
    receiptConsentText: row.receipt_consent_text,
    retentionText: row.retention_text,
    receiptsEnabled: row.receipts_enabled === 1,
    simulationMode: row.simulation_mode === 1,
    methods: methodRows.map((method) => ({
      id: method.id,
      enabled: method.enabled === 1,
      paymentIdentifier: method.payment_identifier,
      recipientName: method.recipient_name,
      instructions: method.instructions,
      memoGuidance: method.memo_guidance,
      externalUrl: method.external_url,
      qrImagePath: method.qr_image_path,
    })),
    designations: (
      designations.results as Array<{
        id: string;
        label: string;
        description: string;
        enabled: number;
      }>
    ).map((designation) => ({ ...designation, enabled: designation.enabled === 1 })),
    impactItems: (
      impacts.results as Array<{
        id: string;
        amount_cents: number;
        statement: string;
        evidence_note: string;
        enabled: number;
        reviewed_at: string | null;
      }>
    ).map((impact) => ({
      id: impact.id,
      amountCents: impact.amount_cents,
      statement: impact.statement,
      evidenceNote: impact.evidence_note,
      enabled: impact.enabled === 1,
      reviewedAt: impact.reviewed_at,
    })),
    revision: row.revision,
  });
}

export async function loadGivingSettings(
  db: SqlDatabase,
  request: Request,
): Promise<PublicGivingData & { source: "environment" | "database" }> {
  const database = await loadDatabaseSettings(db);
  const environment = getEnvironmentGivingSettings(request);
  const settings = database ?? environment.settings;
  const hostname = new URL(request.url).hostname.toLowerCase();
  const localRequest = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  const localOnlyBlocked = settings.simulationMode && !localRequest;
  const setupRequired = localOnlyBlocked
    ? ["replace local simulation details with verified giving information"]
    : database
      ? settings.methods.some((method) => method.enabled)
        ? []
        : ["at least one verified method"]
      : environment.setupRequired;
  return {
    configured: setupRequired.length === 0,
    setupRequired,
    settings: localOnlyBlocked
      ? {
          ...settings,
          receiptsEnabled: false,
          methods: settings.methods.map((method) => ({ ...method, enabled: false })),
        }
      : settings,
    source: database ? "database" : "environment",
  };
}

function mapReceipt(row: Record<string, unknown>): GivingReceiptRequest {
  return {
    id: String(row.id),
    donorName: String(row.donor_name),
    donorEmail: String(row.donor_email),
    amountCents: Number(row.amount_cents),
    paymentMethod: row.payment_method as GivingReceiptRequest["paymentMethod"],
    giftDate: String(row.gift_date),
    designation: String(row.designation),
    transactionReference: String(row.transaction_reference),
    note: String(row.note),
    consentAt: String(row.consent_at),
    status: row.status as GivingReceiptRequest["status"],
    internalNote: String(row.internal_note),
    matchedAt: row.matched_at ? String(row.matched_at) : null,
    receiptIssuedAt: row.receipt_issued_at ? String(row.receipt_issued_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function loadGivingAdmin(
  db: SqlDatabase,
  request: Request,
  user: AdminUser,
  page = 0,
) {
  assertAdministrator(user);
  const pageSize = 25;
  const [giving, receipts, totals] = await Promise.all([
    loadGivingSettings(db, request),
    db
      .prepare(
        `SELECT id, donor_name, donor_email, amount_cents, payment_method, gift_date,
                designation, transaction_reference, note, consent_at, status, internal_note,
                matched_at, receipt_issued_at, created_at, updated_at
         FROM giving_receipt_requests
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(pageSize, page * pageSize)
      .all<Record<string, unknown>>(),
    db
      .prepare(
        `SELECT COUNT(*) AS total,
          SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS submitted,
          SUM(CASE WHEN status = 'matched' THEN 1 ELSE 0 END) AS matched,
          SUM(CASE WHEN status = 'receipt_issued' THEN 1 ELSE 0 END) AS receipt_issued,
          SUM(CASE WHEN status = 'unable_to_match' THEN 1 ELSE 0 END) AS unable_to_match
         FROM giving_receipt_requests`,
      )
      .first<Record<string, number | null>>(),
  ]);
  return {
    ...giving,
    receipts: receipts.results.map((row) => mapReceipt(row)),
    totals: {
      total: totals?.total ?? 0,
      submitted: totals?.submitted ?? 0,
      matched: totals?.matched ?? 0,
      receiptIssued: totals?.receipt_issued ?? 0,
      unableToMatch: totals?.unable_to_match ?? 0,
    },
    page,
    pageSize,
  };
}

export async function saveGivingSettings(db: SqlDatabase, user: AdminUser, input: unknown) {
  assertAdministrator(user);
  const mutation = givingAdminMutationSchema.parse(input);
  if (mutation.action !== "save-settings")
    throw new AdminError(400, "validation", "Choose a valid giving-settings action.");
  const settings = mutation.settings;
  const current = await db
    .prepare("SELECT revision FROM giving_settings WHERE id = 1 AND configured = 1")
    .first<{ revision: number }>();
  if (current && current.revision !== settings.revision)
    throw new AdminError(409, "conflict", "Giving settings changed. Reload and try again.");
  const now = new Date().toISOString();
  const nextRevision = (current?.revision ?? 1) + 1;
  const statements = [
    db
      .prepare(
        `INSERT INTO giving_settings
          (id, configured, public_name, legal_name, tax_status_text, public_ein, support_email,
           support_phone, receipt_turnaround, trust_statement, offline_instructions,
           annual_report_url, social_image_path, privacy_text, receipt_consent_text, retention_text,
           receipts_enabled, simulation_mode, revision, updated_at, updated_by)
         VALUES (1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET configured = 1, public_name = excluded.public_name,
           legal_name = excluded.legal_name, tax_status_text = excluded.tax_status_text,
           public_ein = excluded.public_ein, support_email = excluded.support_email,
           support_phone = excluded.support_phone, receipt_turnaround = excluded.receipt_turnaround,
           trust_statement = excluded.trust_statement,
           offline_instructions = excluded.offline_instructions,
           annual_report_url = excluded.annual_report_url,
           social_image_path = excluded.social_image_path, privacy_text = excluded.privacy_text,
           receipt_consent_text = excluded.receipt_consent_text,
           retention_text = excluded.retention_text, receipts_enabled = excluded.receipts_enabled,
           simulation_mode = excluded.simulation_mode,
           revision = excluded.revision, updated_at = excluded.updated_at,
           updated_by = excluded.updated_by`,
      )
      .bind(
        settings.publicName,
        settings.legalName,
        settings.taxStatusText,
        settings.publicEin,
        settings.supportEmail,
        settings.supportPhone,
        settings.receiptTurnaround,
        settings.trustStatement,
        settings.offlineInstructions,
        settings.annualReportUrl,
        settings.socialImagePath,
        settings.privacyText,
        settings.receiptConsentText,
        settings.retentionText,
        Number(settings.receiptsEnabled),
        Number(settings.simulationMode),
        nextRevision,
        now,
        user.id,
      ),
    db.prepare("DELETE FROM giving_methods"),
    db.prepare("DELETE FROM giving_designations"),
    db.prepare("DELETE FROM giving_impact_items"),
    ...settings.methods.map((method, index) =>
      db
        .prepare(
          `INSERT INTO giving_methods
            (id, enabled, payment_identifier, recipient_name, instructions, memo_guidance,
             external_url, qr_image_path, display_order, updated_at, updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          method.id,
          Number(method.enabled),
          method.paymentIdentifier,
          method.recipientName,
          method.instructions,
          method.memoGuidance,
          method.externalUrl,
          method.qrImagePath,
          index,
          now,
          user.id,
        ),
    ),
    ...settings.designations.map((designation, index) =>
      db
        .prepare(
          `INSERT INTO giving_designations
            (id, label, description, enabled, display_order, created_at, updated_at, updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          designation.id,
          designation.label,
          designation.description,
          Number(designation.enabled),
          index,
          now,
          now,
          user.id,
        ),
    ),
    ...settings.impactItems.map((impact, index) =>
      db
        .prepare(
          `INSERT INTO giving_impact_items
            (id, amount_cents, statement, evidence_note, enabled, display_order, reviewed_at,
             created_at, updated_at, updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          impact.id,
          impact.amountCents,
          impact.statement,
          impact.evidenceNote,
          Number(impact.enabled),
          index,
          impact.reviewedAt,
          now,
          now,
          user.id,
        ),
    ),
    db
      .prepare(
        `INSERT INTO audit_log
          (id, actor_id, action, content_type, record_id, summary, created_at)
         VALUES (?, ?, 'giving.settings', 'giving', 'settings', ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        user.id,
        `Updated giving settings; ${settings.methods.filter((method) => method.enabled).length} method(s) active.`,
        now,
      ),
  ];
  await db.batch(statements);
  return { ok: true as const, revision: nextRevision };
}

export async function createReceiptRequest(db: SqlDatabase, request: Request, input: unknown) {
  const receipt = receiptRequestSchema.parse(input);
  const giving = await loadGivingSettings(db, request);
  if (!giving.settings.receiptsEnabled)
    throw new AdminError(409, "receipts_disabled", "Receipt requests are not available yet.");
  if (
    !giving.settings.methods.some((method) => method.id === receipt.paymentMethod && method.enabled)
  )
    throw new AdminError(400, "invalid_method", "Choose an available giving method.");
  if (
    receipt.designation &&
    !giving.settings.designations.some(
      (designation) => designation.enabled && designation.label === receipt.designation,
    )
  )
    throw new AdminError(400, "invalid_designation", "Choose an available designation.");
  const giftTime = Date.parse(`${receipt.giftDate}T12:00:00Z`);
  const nowTime = Date.now();
  if (!Number.isFinite(giftTime) || giftTime > nowTime + 24 * 60 * 60 * 1000)
    throw new AdminError(400, "invalid_date", "Enter a valid donation date.");
  if (giftTime < nowTime - 10 * 365.25 * 24 * 60 * 60 * 1000)
    throw new AdminError(400, "invalid_date", "Please contact the church about older donations.");
  const amountCents = Math.round(Number(receipt.amount) * 100);
  if (!Number.isSafeInteger(amountCents) || amountCents < 1 || amountCents > 100_000_000)
    throw new AdminError(400, "invalid_amount", "Enter a valid donation amount.");
  const now = new Date().toISOString();
  const recent = await db
    .prepare(
      `SELECT id FROM giving_receipt_requests
       WHERE donor_email = ? AND amount_cents = ? AND payment_method = ? AND gift_date = ?
         AND created_at >= ? LIMIT 1`,
    )
    .bind(
      receipt.donorEmail,
      amountCents,
      receipt.paymentMethod,
      receipt.giftDate,
      new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    )
    .first<{ id: string }>();
  if (!recent) {
    await db
      .prepare(
        `INSERT INTO giving_receipt_requests
          (id, donor_name, donor_email, amount_cents, payment_method, gift_date, designation,
           transaction_reference, note, consent_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        receipt.donorName,
        receipt.donorEmail,
        amountCents,
        receipt.paymentMethod,
        receipt.giftDate,
        receipt.designation,
        receipt.transactionReference,
        receipt.note,
        now,
        now,
        now,
      )
      .run();
  }
  return {
    ok: true as const,
    message:
      "Your receipt request was received. The church will verify the donation before issuing a receipt.",
  };
}

export async function updateReceiptStatus(db: SqlDatabase, user: AdminUser, input: unknown) {
  assertAdministrator(user);
  const mutation = givingAdminMutationSchema.parse(input);
  if (mutation.action !== "receipt-status")
    throw new AdminError(400, "validation", "Choose a valid receipt action.");
  const existing = await db
    .prepare("SELECT status, updated_at FROM giving_receipt_requests WHERE id = ?")
    .bind(mutation.id)
    .first<{ status: string; updated_at: string }>();
  if (!existing) throw new AdminError(404, "not_found", "This receipt request no longer exists.");
  if (existing.updated_at !== mutation.updatedAt)
    throw new AdminError(409, "conflict", "This receipt request changed. Reload and try again.");
  const now = new Date().toISOString();
  const result = await db.batch([
    db
      .prepare(
        `UPDATE giving_receipt_requests SET status = ?, internal_note = ?,
          matched_at = CASE WHEN ? IN ('matched', 'receipt_issued') THEN COALESCE(matched_at, ?) ELSE matched_at END,
          matched_by = CASE WHEN ? IN ('matched', 'receipt_issued') THEN COALESCE(matched_by, ?) ELSE matched_by END,
          receipt_issued_at = CASE WHEN ? = 'receipt_issued' THEN COALESCE(receipt_issued_at, ?) ELSE receipt_issued_at END,
          receipt_issued_by = CASE WHEN ? = 'receipt_issued' THEN COALESCE(receipt_issued_by, ?) ELSE receipt_issued_by END,
          updated_at = ? WHERE id = ? AND updated_at = ?`,
      )
      .bind(
        mutation.status,
        mutation.internalNote,
        mutation.status,
        now,
        mutation.status,
        user.id,
        mutation.status,
        now,
        mutation.status,
        user.id,
        now,
        mutation.id,
        mutation.updatedAt,
      ),
    db
      .prepare(
        `INSERT INTO audit_log
          (id, actor_id, action, content_type, record_id, summary, created_at)
         SELECT ?, ?, 'giving.receipt-status', 'giving_receipt', ?, ?, ? WHERE changes() = 1`,
      )
      .bind(
        crypto.randomUUID(),
        user.id,
        mutation.id,
        `Marked receipt request as ${mutation.status.replaceAll("_", " ")}.`,
        now,
      ),
  ]);
  if (result[0].meta?.changes !== 1)
    throw new AdminError(409, "conflict", "This receipt request changed. Reload and try again.");
  return { ok: true as const };
}

export async function deleteGivingReceipt(db: SqlDatabase, user: AdminUser, input: unknown) {
  assertAdministrator(user);
  const mutation = givingAdminMutationSchema.parse(input);
  if (mutation.action !== "receipt-delete")
    throw new AdminError(400, "validation", "Choose a valid receipt deletion action.");
  const receipt = await db
    .prepare("SELECT status, updated_at FROM giving_receipt_requests WHERE id = ?")
    .bind(mutation.id)
    .first<{ status: string; updated_at: string }>();
  if (!receipt) throw new AdminError(404, "not_found", "Receipt request not found.");
  if (receipt.updated_at !== mutation.updatedAt)
    throw new AdminError(409, "conflict", "This receipt request changed. Reload and try again.");
  const now = new Date().toISOString();
  const result = await db.batch([
    db
      .prepare("DELETE FROM giving_receipt_requests WHERE id = ? AND updated_at = ?")
      .bind(mutation.id, mutation.updatedAt),
    db
      .prepare(
        `INSERT INTO audit_log
          (id, actor_id, action, content_type, record_id, summary, created_at)
         SELECT ?, ?, 'giving.receipt-delete', 'giving_receipt', ?, ?, ? WHERE changes() = 1`,
      )
      .bind(
        crypto.randomUUID(),
        user.id,
        mutation.id,
        `Deleted a ${receipt.status} receipt request under the approved retention process.`,
        now,
      ),
  ]);
  if (result[0].meta?.changes !== 1)
    throw new AdminError(409, "conflict", "This receipt request changed. Reload and try again.");
  return { ok: true as const };
}

function csvCell(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function exportGivingReceiptsCsv(db: SqlDatabase, user: AdminUser) {
  assertAdministrator(user);
  const rows = (
    await db
      .prepare(
        `SELECT donor_name, donor_email, amount_cents, payment_method, gift_date, designation,
                transaction_reference, status, consent_at, created_at
         FROM giving_receipt_requests ORDER BY created_at DESC`,
      )
      .all<Record<string, string | number>>()
  ).results;
  const columns = [
    "Donor name",
    "Donor email",
    "Amount",
    "Method",
    "Gift date",
    "Designation",
    "Reference",
    "Status",
    "Consent recorded",
    "Requested",
  ];
  return `\uFEFF${[
    columns.map(csvCell).join(","),
    ...rows.map((row) =>
      [
        row.donor_name,
        row.donor_email,
        (Number(row.amount_cents) / 100).toFixed(2),
        row.payment_method,
        row.gift_date,
        row.designation,
        row.transaction_reference,
        row.status,
        row.consent_at,
        row.created_at,
      ]
        .map((item) => csvCell(String(item ?? "")))
        .join(","),
    ),
  ].join("\r\n")}\r\n`;
}
