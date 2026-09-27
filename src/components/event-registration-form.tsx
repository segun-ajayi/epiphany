import { useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function EventRegistrationForm({
  eventSlug,
  eventTitle,
  capacity,
}: {
  eventSlug: string;
  eventTitle: string;
  capacity: number | null;
}) {
  const startedAt = useRef(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Registration-Request": "1" },
        body: JSON.stringify({
          eventSlug,
          fullName: data.get("fullName"),
          email: data.get("email"),
          phone: data.get("phone"),
          partySize: data.get("partySize"),
          note: data.get("note"),
          consent: data.get("consent") === "yes",
          website: data.get("website"),
          startedAt: startedAt.current,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Registration could not be completed.");
      form.reset();
      setComplete(true);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Registration could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  if (complete)
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center" role="status">
        <CheckCircle2 className="mx-auto size-9 text-burgundy" />
        <h2 className="mt-3 font-display text-xl">You’re registered</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We have saved your registration for {eventTitle}.
        </p>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="font-display text-xl">Register to attend</h2>
        {capacity && (
          <p className="mt-1 text-xs text-muted-foreground">
            Capacity is limited to {capacity} people.
          </p>
        )}
      </div>
      <Input
        required
        name="fullName"
        maxLength={160}
        placeholder="Full name"
        aria-label="Full name"
      />
      <Input
        required
        name="email"
        type="email"
        maxLength={254}
        placeholder="Email"
        aria-label="Email"
      />
      <Input
        name="phone"
        type="tel"
        maxLength={40}
        placeholder="Phone (optional)"
        aria-label="Phone"
      />
      <label className="grid gap-2 text-sm font-medium">
        Number attending
        <Input required name="partySize" type="number" min={1} max={20} defaultValue={1} />
      </label>
      <Textarea
        name="note"
        maxLength={1000}
        rows={3}
        placeholder="Accessibility needs or a note (optional)"
        aria-label="Note"
      />
      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <input required type="checkbox" name="consent" value="yes" className="mt-1" />
        <span>
          I consent to the church storing these details to manage this event registration.
        </span>
      </label>
      <label className="absolute -left-[10000px]" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Registering…" : "Register"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Use one registration per email address. Contact the church if your plans change.
      </p>
    </form>
  );
}
