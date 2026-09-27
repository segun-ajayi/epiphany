import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, ReceiptText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GivingDesignation, GivingMethod } from "@/lib/giving/schemas";

export function ReceiptRequestForm({
  methods,
  designations,
  consentText,
  privacyText,
  retentionText,
  turnaround,
}: {
  methods: GivingMethod[];
  designations: GivingDesignation[];
  consentText: string;
  privacyText: string;
  retentionText: string;
  turnaround: string;
}) {
  const startedAt = useRef(0);
  const [state, setState] = useState<"idle" | "sending" | "success">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/giving/receipt-requests", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Giving-Request": "1" },
        body: JSON.stringify({
          donorName: form.get("donorName") ?? "",
          donorEmail: form.get("donorEmail") ?? "",
          amount: form.get("amount") ?? "",
          paymentMethod: form.get("paymentMethod") ?? "",
          giftDate: form.get("giftDate") ?? "",
          designation: form.get("designation") ?? "",
          transactionReference: form.get("transactionReference") ?? "",
          note: form.get("note") ?? "",
          consent: form.get("consent") === "yes",
          website: form.get("website") ?? "",
          startedAt: startedAt.current,
        }),
      });
      const body = response.headers.get("content-type")?.includes("application/json")
        ? await response.json()
        : null;
      if (!response.ok) throw new Error(body?.error || "Please try again in a moment.");
      setState("success");
    } catch (caught) {
      setState("idle");
      setError(caught instanceof Error ? caught.message : "Please try again in a moment.");
    }
  }

  if (state === "success")
    return (
      <div className="rounded-2xl border bg-card p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto size-11 text-burgundy" aria-hidden />
        <h3 className="mt-4 font-display text-2xl">Request received</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          The church will verify the external transfer before issuing a receipt.
          {turnaround ? ` ${turnaround}` : ""}
        </p>
      </div>
    );

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-5 md:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold/20 text-burgundy">
          <ReceiptText className="size-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-display text-2xl">Request a donation receipt</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit this form after completing your gift. A request does not confirm that payment was
            received.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Donor name
          <Input name="donorName" required maxLength={160} autoComplete="name" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Email address
          <Input name="donorEmail" type="email" required maxLength={254} autoComplete="email" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Donation amount (USD)
          <Input
            name="amount"
            required
            inputMode="decimal"
            placeholder="100.00"
            pattern="\d{1,7}(\.\d{1,2})?"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Donation date
          <Input name="giftDate" type="date" required />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Giving method
          <select name="paymentMethod" required className="h-10 rounded-md border bg-background px-3">
            {methods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.id === "zelle" ? "Zelle" : "Cash App"}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Designation <span className="font-normal text-muted-foreground">(optional)</span>
          <select name="designation" className="h-10 rounded-md border bg-background px-3">
            <option value="">No designation</option>
            {designations.map((designation) => (
              <option key={designation.id} value={designation.label}>
                {designation.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">
          Transaction reference <span className="font-normal text-muted-foreground">(optional)</span>
          <Input name="transactionReference" maxLength={120} />
        </label>
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
          <textarea
            name="note"
            maxLength={1000}
            rows={3}
            className="rounded-md border bg-background px-3 py-2"
          />
        </label>
      </div>

      <div className="absolute -left-[10000px]" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed">
        <input name="consent" value="yes" required type="checkbox" className="mt-1 size-4" />
        <span>{consentText}</span>
      </label>
      {(privacyText || retentionText) && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {[privacyText, retentionText].filter(Boolean).join(" ")}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="mt-6" disabled={state === "sending"}>
        {state === "sending" ? "Submitting…" : "Submit receipt request"}
        {state !== "sending" && <Send className="size-4" aria-hidden />}
      </Button>
    </form>
  );
}
