import { useEffect, useState } from "react";
import { Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ContactMessage, ContactStatus } from "@/lib/contact/schemas";

type ContactData = {
  messages: ContactMessage[];
  total: number;
  unread: number;
  page: number;
  pageSize: number;
};

export function ContactManager() {
  const [data, setData] = useState<ContactData | null>(null);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  async function load(page = 0) {
    const response = await fetch(`/api/admin/contact?page=${page}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "The message inbox could not be loaded.");
    setData(body);
  }

  useEffect(() => {
    void load().catch((error) => setMessage(error.message));
  }, []);

  async function update(item: ContactMessage, status: ContactStatus, internalNote: string) {
    setBusyId(item.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/contact", {
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
      if (!response.ok) throw new Error(body.error || "The message could not be updated.");
      await load(data?.page ?? 0);
      setMessage("Message updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The message could not be updated.");
    } finally {
      setBusyId("");
    }
  }

  async function remove(item: ContactMessage) {
    if (!window.confirm("Permanently delete this message? This cannot be undone.")) return;
    setBusyId(item.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/contact", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({ action: "delete", id: item.id, updatedAt: item.updatedAt }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The message could not be deleted.");
      await load(data?.page ?? 0);
      setMessage("Message permanently deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The message could not be deleted.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section aria-labelledby="contact-inbox-heading">
      <p className="flex items-center gap-2 text-sm text-burgundy">
        <Mail className="size-4" /> Private correspondence
      </p>
      <h2 id="contact-inbox-heading" className="mt-2 font-display text-3xl">
        Contact inbox
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Visible only to administrators. Prayer and pastoral messages should be handled
        confidentially.
      </p>
      <div className="mt-5 flex gap-4 text-sm">
        <span>{data?.unread ?? 0} new</span>
        <span>{data?.total ?? 0} total</span>
      </div>
      {message && (
        <p role="status" className="mt-5 rounded-xl bg-secondary p-4 text-sm">
          {message}
        </p>
      )}
      <div className="mt-7 space-y-5">
        {data?.messages.map((item) => (
          <MessageCard
            key={item.id}
            item={item}
            busy={busyId === item.id}
            onUpdate={update}
            onRemove={remove}
          />
        ))}
        {data && !data.messages.length && (
          <p className="rounded-xl border p-8 text-center text-muted-foreground">
            No messages yet.
          </p>
        )}
        {!data && !message && <p className="text-muted-foreground">Loading messages…</p>}
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

function MessageCard({
  item,
  busy,
  onUpdate,
  onRemove,
}: {
  item: ContactMessage;
  busy: boolean;
  onUpdate: (item: ContactMessage, status: ContactStatus, note: string) => Promise<void>;
  onRemove: (item: ContactMessage) => Promise<void>;
}) {
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState(item.internalNote);
  return (
    <article
      className={`rounded-2xl border bg-card p-5 md:p-6 ${item.status === "new" ? "border-burgundy" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-burgundy">
            {item.topic} · {item.status}
          </p>
          <h3 className="mt-1 font-display text-xl">{item.subject || "Website message"}</h3>
          <p className="mt-1 text-sm">
            {item.firstName} {item.lastName} ·{" "}
            <a className="underline" href={`mailto:${item.email}`}>
              {item.email}
            </a>
            {item.phone ? ` · ${item.phone}` : ""}
          </p>
        </div>
        <time className="text-xs text-muted-foreground">
          {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
            new Date(item.createdAt),
          )}
        </time>
      </div>
      <p className="mt-5 whitespace-pre-line rounded-xl bg-secondary/60 p-4 text-sm leading-relaxed">
        {item.message}
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-[180px_1fr_auto] md:items-end">
        <label className="grid gap-2 text-sm font-medium">
          Status
          <select
            className="h-10 rounded-md border bg-background px-3"
            value={status}
            onChange={(e) => setStatus(e.target.value as ContactStatus)}
          >
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Internal note
          <Textarea
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <div className="flex gap-2">
          <Button disabled={busy} onClick={() => void onUpdate(item, status, note)}>
            Save
          </Button>
          <Button
            variant="outline"
            disabled={busy || item.status !== "resolved"}
            title={item.status === "resolved" ? "Permanently delete" : "Resolve before deleting"}
            onClick={() => void onRemove(item)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
