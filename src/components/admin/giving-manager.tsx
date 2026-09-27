import { useEffect, useState } from "react";
import { Download, Eye, Plus, RefreshCw, Save, TestTube2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GivingReceiptRequest, GivingSettings, ReceiptStatus } from "@/lib/giving/schemas";
import { prepareImageUpload } from "@/lib/admin/image";

type GivingAdminData = {
  configured: boolean;
  setupRequired: string[];
  source: "environment" | "database";
  settings: GivingSettings;
  receipts: GivingReceiptRequest[];
  totals: {
    total: number;
    submitted: number;
    matched: number;
    receiptIssued: number;
    unableToMatch: number;
  };
  page: number;
  pageSize: number;
};

const textFields: Array<[keyof GivingSettings, string, boolean?]> = [
  ["publicName", "Public church name"],
  ["legalName", "Legal name"],
  ["taxStatusText", "Approved tax-status wording", true],
  ["publicEin", "Public EIN (optional)"],
  ["supportEmail", "Giving support email"],
  ["supportPhone", "Giving support phone"],
  ["receiptTurnaround", "Receipt turnaround wording", true],
  ["trustStatement", "Safety and trust statement", true],
  ["offlineInstructions", "Offline giving instructions", true],
  ["annualReportUrl", "Annual report URL"],
  ["socialImagePath", "Social image path"],
  ["privacyText", "Privacy wording", true],
  ["receiptConsentText", "Receipt consent wording", true],
  ["retentionText", "Data retention wording", true],
];

export function GivingManager() {
  const [data, setData] = useState<GivingAdminData | null>(null);
  const [settings, setSettings] = useState<GivingSettings | null>(null);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [destinationConfirmed, setDestinationConfirmed] = useState(false);

  async function load(page = 0) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/giving?page=${page}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load giving settings.");
      setData(body);
      setSettings(body.settings);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load giving settings.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!settings) return;
    const destinationsChanged = settings.methods.some((method) => {
      const previous = data?.settings.methods.find((item) => item.id === method.id);
      return (
        method.enabled &&
        (!previous ||
          previous.paymentIdentifier !== method.paymentIdentifier ||
          previous.recipientName !== method.recipientName ||
          previous.externalUrl !== method.externalUrl)
      );
    });
    if (destinationsChanged && !destinationConfirmed) {
      setMessage("Confirm the active payment destinations below before saving.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/giving", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({ action: "save-settings", settings }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save giving settings.");
      setMessage("Giving settings saved. The public page now uses the database values.");
      setDestinationConfirmed(false);
      await load(data?.page ?? 0);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save giving settings.");
      setBusy(false);
    }
  }

  function loadDemo() {
    const reviewedAt = new Date().toISOString();
    setSettings({
      ...settings!,
      publicName: "Anglican Church of the Epiphany — LOCAL DEMO",
      legalName: "Demo organization — not for receipts",
      taxStatusText:
        "Simulation wording only. Replace with treasurer-approved tax wording before production.",
      supportEmail: "giving@example.invalid",
      receiptTurnaround:
        "For this simulation, requests appear immediately in the administrator queue.",
      trustStatement:
        "LOCAL SIMULATION — do not send money. These are deliberately non-payable demonstration details.",
      privacyText: "Simulation data is stored only in the local development database.",
      receiptConsentText:
        "I consent to using these simulated details to test the local receipt workflow.",
      retentionText: "Delete simulated donor records after testing.",
      receiptsEnabled: true,
      simulationMode: true,
      methods: [
        {
          id: "zelle",
          enabled: true,
          paymentIdentifier: "demo-zelle@example.invalid",
          recipientName: "LOCAL DEMO — DO NOT PAY",
          instructions: "Open your bank app only to review the workflow. Do not send money.",
          memoGuidance: "LOCAL TEST",
          externalUrl: "",
          qrImagePath: "",
        },
        {
          id: "cash_app",
          enabled: true,
          paymentIdentifier: "$EpiphanyLocalDemo",
          recipientName: "LOCAL DEMO — DO NOT PAY",
          instructions: "This button uses a harmless example page and cannot initiate a payment.",
          memoGuidance: "LOCAL TEST",
          externalUrl: "https://example.com/",
          qrImagePath: "",
        },
      ],
      designations: [
        {
          id: crypto.randomUUID(),
          label: "General Fund",
          description: "Demonstration designation",
          enabled: true,
        },
        {
          id: crypto.randomUUID(),
          label: "Community Outreach",
          description: "Demonstration designation",
          enabled: true,
        },
      ],
      impactItems: [
        {
          id: crypto.randomUUID(),
          amountCents: 2500,
          statement: "Demonstration impact statement — replace with approved evidence.",
          evidenceNote: "Local simulation only",
          enabled: true,
          reviewedAt,
        },
      ],
    });
    setMessage(
      "Safe demonstration values loaded into the form. Review them, then save to activate the local simulation.",
    );
  }

  async function uploadQr(methodIndex: number, file: File) {
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("method", settings!.methods[methodIndex].id);
      form.set("image", await prepareImageUpload(file));
      const response = await fetch("/api/admin/giving-media", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-Admin-Request": "1" },
        body: form,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to upload the QR image.");
      const methods = [...settings!.methods];
      methods[methodIndex] = { ...methods[methodIndex], qrImagePath: body.path };
      setSettings({ ...settings!, methods });
      setMessage("QR image uploaded. Save giving settings to attach it to this method.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload the QR image.");
    } finally {
      setBusy(false);
    }
  }

  async function updateReceipt(
    receipt: GivingReceiptRequest,
    status: ReceiptStatus,
    internalNote: string,
  ) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/giving", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({
          action: "receipt-status",
          id: receipt.id,
          status,
          internalNote,
          updatedAt: receipt.updatedAt,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to update the receipt request.");
      await load(data?.page ?? 0);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update the receipt request.");
      setBusy(false);
    }
  }

  async function deleteReceipt(receipt: GivingReceiptRequest) {
    if (
      !window.confirm(
        "Permanently delete this receipt request under the church's approved retention policy? This cannot be undone.",
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/giving", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({
          action: "receipt-delete",
          id: receipt.id,
          updatedAt: receipt.updatedAt,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to delete the receipt request.");
      setMessage("Receipt request deleted and recorded in the audit history.");
      await load(data?.page ?? 0);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete the receipt request.");
      setBusy(false);
    }
  }

  if (!settings || !data)
    return <p className="rounded-xl border p-6 text-sm">{message || "Loading giving settings…"}</p>;
  const setField = (key: keyof GivingSettings, value: unknown) =>
    setSettings({ ...settings, [key]: value });
  const destinationsChanged = settings.methods.some((method) => {
    const previous = data.settings.methods.find((item) => item.id === method.id);
    return (
      method.enabled &&
      (!previous ||
        previous.paymentIdentifier !== method.paymentIdentifier ||
        previous.recipientName !== method.recipientName ||
        previous.externalUrl !== method.externalUrl)
    );
  });

  return (
    <div className="space-y-10" aria-busy={busy}>
      <section className="rounded-2xl border p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">Giving configuration</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Currently loaded from <strong>{data.source}</strong>. Saving creates a database
              override; environment values remain the portable starting defaults.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={busy} onClick={loadDemo}>
              <TestTube2 className="size-4" /> Load safe demo
            </Button>
            <Button asChild variant="outline">
              <a href="/give" target="_blank" rel="noopener noreferrer">
                <Eye className="size-4" /> View public page
              </a>
            </Button>
            <Button
              disabled={busy || (destinationsChanged && !destinationConfirmed)}
              onClick={() => void save()}
            >
              <Save className="size-4" /> Save giving settings
            </Button>
          </div>
        </div>
        {!!data.setupRequired.length && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Setup still requires: {data.setupRequired.join(", ")}.
          </p>
        )}
        {destinationsChanged && (
          <label className="mt-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-950">
            <input
              type="checkbox"
              className="mt-1"
              checked={destinationConfirmed}
              onChange={(event) => setDestinationConfirmed(event.target.checked)}
            />
            I confirmed each active identifier and displayed recipient name with the authorized
            church account holder.
          </label>
        )}
        {message && (
          <p role="status" className="mt-4 rounded-lg bg-secondary p-3 text-sm">
            {message}
          </p>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {textFields.map(([key, label, multiline]) => (
            <label
              key={key}
              className={`grid gap-2 text-sm font-medium ${multiline ? "md:col-span-2" : ""}`}
            >
              {label}
              {multiline ? (
                <textarea
                  rows={3}
                  value={String(settings[key])}
                  onChange={(event) => setField(key, event.target.value)}
                  className="rounded-md border bg-background px-3 py-2"
                />
              ) : (
                <Input
                  value={String(settings[key])}
                  onChange={(event) => setField(key, event.target.value)}
                />
              )}
            </label>
          ))}
        </div>
        <label className="mt-5 flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={settings.receiptsEnabled}
            onChange={(event) => setField("receiptsEnabled", event.target.checked)}
          />{" "}
          Enable receipt requests
        </label>
        <label className="mt-3 flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={settings.simulationMode}
            onChange={(event) => setField("simulationMode", event.target.checked)}
          />{" "}
          Local simulation mode
        </label>
        {settings.simulationMode && (
          <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-950">
            Simulation details are displayed only on localhost and are suppressed automatically on
            the production website.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl">Giving methods</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {settings.methods.map((method, index) => (
            <article key={method.id} className="rounded-2xl border p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{method.id === "zelle" ? "Zelle" : "Cash App"}</h3>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={method.enabled}
                    onChange={(event) => {
                      const methods = [...settings.methods];
                      methods[index] = { ...method, enabled: event.target.checked };
                      setField("methods", methods);
                    }}
                  />{" "}
                  Active
                </label>
              </div>
              <div className="mt-4 grid gap-3">
                {(
                  [
                    ["paymentIdentifier", "Payment identifier"],
                    ["recipientName", "Verified recipient name"],
                    ["instructions", "Instructions"],
                    ["memoGuidance", "Memo guidance"],
                    ["externalUrl", "External HTTPS URL"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="grid gap-1 text-xs font-medium">
                    {label}
                    <Input
                      value={method[key]}
                      onChange={(event) => {
                        const methods = [...settings.methods];
                        methods[index] = { ...method, [key]: event.target.value };
                        setField("methods", methods);
                      }}
                    />
                  </label>
                ))}
                <label className="grid gap-2 text-xs font-medium">
                  Official QR image
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={busy}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadQr(index, file);
                    }}
                  />
                  <span className="font-normal text-muted-foreground">
                    Upload the QR image exported from the verified church account. JPG, PNG or WebP;
                    maximum 1.25 MB.
                  </span>
                </label>
                {method.qrImagePath && (
                  <div className="flex items-start gap-3">
                    <img
                      src={method.qrImagePath}
                      alt={`${method.id === "zelle" ? "Zelle" : "Cash App"} QR preview`}
                      className="size-32 rounded-lg border bg-white object-contain p-2"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const methods = [...settings.methods];
                        methods[index] = { ...method, qrImagePath: "" };
                        setField("methods", methods);
                      }}
                    >
                      Remove image
                    </Button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Designations</h2>
          <Button
            variant="outline"
            onClick={() =>
              setField("designations", [
                ...settings.designations,
                { id: crypto.randomUUID(), label: "", description: "", enabled: true },
              ])
            }
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {settings.designations.map((item, index) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_2fr_auto_auto]"
            >
              <Input
                aria-label="Designation name"
                value={item.label}
                onChange={(event) => {
                  const list = [...settings.designations];
                  list[index] = { ...item, label: event.target.value };
                  setField("designations", list);
                }}
              />
              <Input
                aria-label="Designation description"
                value={item.description}
                onChange={(event) => {
                  const list = [...settings.designations];
                  list[index] = { ...item, description: event.target.value };
                  setField("designations", list);
                }}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(event) => {
                    const list = [...settings.designations];
                    list[index] = { ...item, enabled: event.target.checked };
                    setField("designations", list);
                  }}
                />{" "}
                Active
              </label>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove designation"
                onClick={() =>
                  setField(
                    "designations",
                    settings.designations.filter((_, i) => i !== index),
                  )
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Impact statements</h2>
          <Button
            variant="outline"
            onClick={() =>
              setField("impactItems", [
                ...settings.impactItems,
                {
                  id: crypto.randomUUID(),
                  amountCents: 100,
                  statement: "",
                  evidenceNote: "",
                  enabled: false,
                  reviewedAt: null,
                },
              ])
            }
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Only enabled items with a review date appear publicly.
        </p>
        <div className="mt-4 space-y-4">
          {settings.impactItems.map((item, index) => (
            <div key={item.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-2">
              <label className="grid gap-1 text-xs font-medium">
                Amount (USD)
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={(item.amountCents / 100).toString()}
                  onChange={(event) => {
                    const list = [...settings.impactItems];
                    list[index] = {
                      ...item,
                      amountCents: Math.round(Number(event.target.value) * 100),
                    };
                    setField("impactItems", list);
                  }}
                />
              </label>
              <label className="grid gap-1 text-xs font-medium">
                Reviewed date
                <Input
                  type="date"
                  value={item.reviewedAt?.slice(0, 10) || ""}
                  onChange={(event) => {
                    const list = [...settings.impactItems];
                    list[index] = {
                      ...item,
                      reviewedAt: event.target.value ? `${event.target.value}T00:00:00.000Z` : null,
                    };
                    setField("impactItems", list);
                  }}
                />
              </label>
              <label className="grid gap-1 text-xs font-medium md:col-span-2">
                Public statement
                <Input
                  value={item.statement}
                  onChange={(event) => {
                    const list = [...settings.impactItems];
                    list[index] = { ...item, statement: event.target.value };
                    setField("impactItems", list);
                  }}
                />
              </label>
              <label className="grid gap-1 text-xs font-medium">
                Internal evidence note
                <Input
                  value={item.evidenceNote}
                  onChange={(event) => {
                    const list = [...settings.impactItems];
                    list[index] = { ...item, evidenceNote: event.target.value };
                    setField("impactItems", list);
                  }}
                />
              </label>
              <div className="flex items-end justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(event) => {
                      const list = [...settings.impactItems];
                      list[index] = { ...item, enabled: event.target.checked };
                      setField("impactItems", list);
                    }}
                  />{" "}
                  Active
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove impact statement"
                  onClick={() =>
                    setField(
                      "impactItems",
                      settings.impactItems.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Receipt requests</h2>
            <p className="text-sm text-muted-foreground">
              {data.totals.submitted} awaiting review · {data.totals.total} total
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={busy} onClick={() => void load(data.page)}>
              <RefreshCw className="size-4" /> Refresh
            </Button>
            <Button asChild variant="outline">
              <a href="/api/admin/giving?format=csv">
                <Download className="size-4" /> Export CSV
              </a>
            </Button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="p-3">Donor</th>
                <th className="p-3">Gift</th>
                <th className="p-3">Reference</th>
                <th className="p-3">Status and internal note</th>
              </tr>
            </thead>
            <tbody>
              {data.receipts.map((receipt) => (
                <ReceiptRow
                  key={receipt.id}
                  receipt={receipt}
                  disabled={busy}
                  onSave={updateReceipt}
                  onDelete={deleteReceipt}
                />
              ))}
            </tbody>
          </table>
          {!data.receipts.length && (
            <p className="p-8 text-center text-muted-foreground">No receipt requests yet.</p>
          )}
        </div>
        <div className="mt-3 flex justify-between">
          <Button
            variant="outline"
            disabled={busy || data.page === 0}
            onClick={() => void load(data.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm">Page {data.page + 1}</span>
          <Button
            variant="outline"
            disabled={busy || (data.page + 1) * data.pageSize >= data.totals.total}
            onClick={() => void load(data.page + 1)}
          >
            Next
          </Button>
        </div>
      </section>
    </div>
  );
}

function ReceiptRow({
  receipt,
  disabled,
  onSave,
  onDelete,
}: {
  receipt: GivingReceiptRequest;
  disabled: boolean;
  onSave: (receipt: GivingReceiptRequest, status: ReceiptStatus, note: string) => Promise<void>;
  onDelete: (receipt: GivingReceiptRequest) => Promise<void>;
}) {
  const [status, setStatus] = useState(receipt.status);
  const [note, setNote] = useState(receipt.internalNote);
  return (
    <tr className="border-t align-top">
      <td className="p-3">
        <p className="font-medium">{receipt.donorName}</p>
        <a className="text-xs underline" href={`mailto:${receipt.donorEmail}`}>
          {receipt.donorEmail}
        </a>
        <p className="mt-1 text-xs">{receipt.giftDate}</p>
      </td>
      <td className="p-3">
        <p>
          ${(receipt.amountCents / 100).toFixed(2)} ·{" "}
          {receipt.paymentMethod === "cash_app" ? "Cash App" : "Zelle"}
        </p>
        <p className="text-xs text-muted-foreground">{receipt.designation || "No designation"}</p>
      </td>
      <td className="p-3">
        <p className="break-all">{receipt.transactionReference || "—"}</p>
        <p className="mt-1 text-xs text-muted-foreground">{receipt.note}</p>
      </td>
      <td className="p-3">
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ReceiptStatus)}
            className="h-9 rounded-md border bg-background px-2"
          >
            <option value="submitted">Submitted</option>
            <option value="matched">Matched</option>
            <option value="receipt_issued">Receipt issued</option>
            <option value="unable_to_match">Unable to match</option>
          </select>
          <Input
            aria-label="Internal note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <Button size="sm" disabled={disabled} onClick={() => void onSave(receipt, status, note)}>
            Save
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={disabled}
            onClick={() => void onDelete(receipt)}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
