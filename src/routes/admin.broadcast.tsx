import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { adminListSubscribers, adminSendBroadcast } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/admin/broadcast")({
  component: BroadcastPage,
});

function BroadcastPage() {
  const list = useServerFn(adminListSubscribers);
  const send = useServerFn(adminSendBroadcast);
  const { data } = useQuery({ queryKey: ["admin", "subscribers"], queryFn: () => list() });
  const count = (data ?? []).length;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const mutation = useMutation({
    mutationFn: () => send({ data: { title, body } }),
    onSuccess: (r) => {
      toast.success(
        `Broadcast sent to ${r.sent} subscriber${r.sent === 1 ? "" : "s"}` +
          (r.failed ? ` (${r.failed} failed)` : "") +
          ` · via ${r.provider}`,
      );
      setTitle(""); setBody("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Send failed"),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || body.trim().length < 5) {
      toast.error("Title and a longer body are required.");
      return;
    }
    if (!confirm(`Send "${title}" to ${count} subscriber${count === 1 ? "" : "s"}?`)) return;
    mutation.mutate();
  }

  return (
    <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <h1 className="font-display text-3xl">Compose Broadcast</h1>
          <p className="text-sm text-muted-foreground">
            Send a newsletter update to all {count} active subscriber{count === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Title / Subject</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="This week at Epiphany" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Message body</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your update here. Use blank lines to separate paragraphs."
            rows={14}
            required
          />
          <p className="text-xs text-muted-foreground">Plain text. Blank lines become paragraph breaks in the email.</p>
        </div>
        <Button type="submit" size="lg" disabled={mutation.isPending || count === 0}>
          <Send className="size-4" />
          {mutation.isPending ? "Sending…" : `Send to ${count} subscriber${count === 1 ? "" : "s"}`}
        </Button>
      </form>

      <aside className="space-y-4">
        <Card className="p-6">
          <h2 className="font-display text-lg">Live preview</h2>
          <div className="mt-4 rounded-lg border border-border bg-white p-6 text-sm text-gray-900">
            <h3 className="font-display text-xl text-burgundy">{title || "Untitled broadcast"}</h3>
            <div className="mt-3 space-y-3 whitespace-pre-wrap">
              {body || <span className="text-muted-foreground">Your message will appear here…</span>}
            </div>
          </div>
        </Card>
      </aside>
    </div>
  );
}
