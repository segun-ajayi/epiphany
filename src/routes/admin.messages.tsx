import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Archive, CheckCheck, Mail, MailOpen } from "lucide-react";
import { toast } from "sonner";

import { adminListMessages, adminUpdateMessageStatus } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/messages")({
  component: MessagesPage,
});

type Message = {
  id: number; firstName: string; lastName: string; email: string;
  phone: string | null; subject: string | null; message: string;
  status: "unread" | "read" | "archived"; createdAt: number;
};

function MessagesPage() {
  const list = useServerFn(adminListMessages);
  const updateStatus = useServerFn(adminUpdateMessageStatus);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["admin", "messages"], queryFn: () => list() });
  const mutation = useMutation({
    mutationFn: (v: { id: number; status: Message["status"] }) => updateStatus({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "messages"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const [open, setOpen] = useState<Message | null>(null);
  const messages = (data ?? []) as Message[];

  function openMessage(m: Message) {
    setOpen(m);
    if (m.status === "unread") mutation.mutate({ id: m.id, status: "read" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl">Contact Messages</h1>
          <p className="text-sm text-muted-foreground">
            {messages.filter((m) => m.status === "unread").length} unread · {messages.length} total
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Received</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
            )}
            {!isLoading && messages.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No messages yet.</TableCell></TableRow>
            )}
            {messages.map((m) => (
              <TableRow key={m.id} className={m.status === "unread" ? "font-medium" : ""}>
                <TableCell><StatusBadge status={m.status} /></TableCell>
                <TableCell>
                  <button onClick={() => openMessage(m)} className="text-left hover:underline">
                    {m.firstName} {m.lastName}
                    <div className="text-xs text-muted-foreground font-normal">{m.email}</div>
                  </button>
                </TableCell>
                <TableCell>
                  <button onClick={() => openMessage(m)} className="text-left hover:underline">
                    {m.subject || <span className="text-muted-foreground italic">(no subject)</span>}
                  </button>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(m.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    {m.status !== "read" && (
                      <Button size="sm" variant="ghost" onClick={() => mutation.mutate({ id: m.id, status: "read" })} title="Mark as read">
                        <MailOpen className="size-4" />
                      </Button>
                    )}
                    {m.status !== "unread" && m.status !== "archived" && (
                      <Button size="sm" variant="ghost" onClick={() => mutation.mutate({ id: m.id, status: "unread" })} title="Mark as unread">
                        <Mail className="size-4" />
                      </Button>
                    )}
                    {m.status !== "archived" && (
                      <Button size="sm" variant="ghost" onClick={() => mutation.mutate({ id: m.id, status: "archived" })} title="Archive">
                        <Archive className="size-4" />
                      </Button>
                    )}
                    {m.status === "archived" && (
                      <Button size="sm" variant="ghost" onClick={() => mutation.mutate({ id: m.id, status: "read" })} title="Restore">
                        <CheckCheck className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{open.subject || "(no subject)"}</DialogTitle>
                <DialogDescription>
                  From {open.firstName} {open.lastName} · {open.email}
                  {open.phone ? ` · ${open.phone}` : ""}
                  <br />
                  {new Date(open.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="whitespace-pre-wrap text-sm leading-relaxed border-t border-border pt-4">
                {open.message}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <a href={`mailto:${open.email}?subject=Re: ${encodeURIComponent(open.subject || "")}`}>
                  <Button variant="outline">Reply via Email</Button>
                </a>
                <Button onClick={() => { mutation.mutate({ id: open.id, status: "archived" }); setOpen(null); }}>
                  Archive
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: Message["status"] }) {
  if (status === "unread") return <Badge className="bg-gold text-gold-foreground">New</Badge>;
  if (status === "archived") return <Badge variant="outline">Archived</Badge>;
  return <Badge variant="secondary">Read</Badge>;
}
