import { useEffect, useState } from "react";
import { CalendarCheck2, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { EventRegistration, RegistrationStatus } from "@/lib/registrations/schemas";

type RegistrationData = {
  registrations: EventRegistration[];
  total: number;
  page: number;
  pageSize: number;
};

export function RegistrationManager() {
  const [data, setData] = useState<RegistrationData | null>(null);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  async function load(page = 0) {
    const response = await fetch(`/api/admin/registrations?page=${page}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Registrations could not be loaded.");
    setData(body);
  }

  useEffect(() => {
    void load().catch((error) => setMessage(error.message));
  }, []);

  async function update(item: EventRegistration, status: RegistrationStatus, internalNote: string) {
    setBusyId(item.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/registrations", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({
          action: "status",
          id: item.id,
          status,
          internalNote,
          updatedAt: item.updatedAt,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Registration could not be updated.");
      await load(data?.page ?? 0);
      setMessage("Registration updated.");
    } catch (problem) {
      setMessage(problem instanceof Error ? problem.message : "Registration could not be updated.");
    } finally {
      setBusyId("");
    }
  }

  async function remove(item: EventRegistration) {
    if (!window.confirm("Permanently delete this cancelled registration? This cannot be undone."))
      return;
    setBusyId(item.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/registrations", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({ action: "delete", id: item.id, updatedAt: item.updatedAt }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Registration could not be deleted.");
      await load(data?.page ?? 0);
      setMessage("Cancelled registration permanently deleted.");
    } catch (problem) {
      setMessage(problem instanceof Error ? problem.message : "Registration could not be deleted.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section aria-labelledby="registrations-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm text-burgundy">
            <CalendarCheck2 className="size-4" /> Private attendee details
          </p>
          <h2 id="registrations-heading" className="mt-2 font-display text-3xl">
            Event registrations
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Visible only to administrators. Export a copy when event leaders need an attendee list.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/api/admin/registrations?format=csv">
            <Download className="size-4" /> Export CSV
          </a>
        </Button>
      </div>
      <p className="mt-5 text-sm">{data?.total ?? 0} total registrations</p>
      {message && (
        <p role="status" className="mt-5 rounded-xl bg-secondary p-4 text-sm">
          {message}
        </p>
      )}
      <div className="mt-7 space-y-5">
        {data?.registrations.map((item) => (
          <RegistrationCard
            key={item.id}
            item={item}
            busy={busyId === item.id}
            onUpdate={update}
            onRemove={remove}
          />
        ))}
        {data && !data.registrations.length && (
          <p className="rounded-xl border p-8 text-center text-muted-foreground">
            No event registrations yet.
          </p>
        )}
        {!data && !message && <p className="text-muted-foreground">Loading registrations…</p>}
      </div>
      {data && data.total > data.pageSize && (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={data.page === 0}
            onClick={() => void load(data.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm">Page {data.page + 1}</span>
          <Button
            variant="outline"
            disabled={(data.page + 1) * data.pageSize >= data.total}
            onClick={() => void load(data.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </section>
  );
}

function RegistrationCard({
  item,
  busy,
  onUpdate,
  onRemove,
}: {
  item: EventRegistration;
  busy: boolean;
  onUpdate: (item: EventRegistration, status: RegistrationStatus, note: string) => Promise<void>;
  onRemove: (item: EventRegistration) => Promise<void>;
}) {
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState(item.internalNote);
  return (
    <article
      className={`rounded-2xl border bg-card p-5 md:p-6 ${item.status === "registered" ? "border-burgundy" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-burgundy">
            {item.eventTitle} · party of {item.partySize}
          </p>
          <h3 className="mt-1 font-display text-xl">{item.fullName}</h3>
          <p className="mt-1 text-sm">
            <a className="underline" href={`mailto:${item.email}`}>
              {item.email}
            </a>
            {item.phone ? ` · ${item.phone}` : ""}
          </p>
          {item.note && (
            <p className="mt-3 whitespace-pre-line rounded-xl bg-secondary/60 p-3 text-sm">
              {item.note}
            </p>
          )}
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>
            Event:{" "}
            {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
              new Date(item.eventStartsAt),
            )}
          </p>
          <p>
            Registered:{" "}
            {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
              new Date(item.createdAt),
            )}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-[180px_1fr_auto] md:items-end">
        <label className="grid gap-2 text-sm font-medium">
          Status
          <select
            className="h-10 rounded-md border bg-background px-3"
            value={status}
            onChange={(event) => setStatus(event.target.value as RegistrationStatus)}
          >
            <option value="registered">Registered</option>
            <option value="attended">Attended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Internal note
          <Textarea
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <div className="flex gap-2">
          <Button disabled={busy} onClick={() => void onUpdate(item, status, note)}>
            Save
          </Button>
          <Button
            variant="outline"
            disabled={busy || item.status !== "cancelled"}
            title={item.status === "cancelled" ? "Permanently delete" : "Cancel before deleting"}
            onClick={() => void onRemove(item)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
