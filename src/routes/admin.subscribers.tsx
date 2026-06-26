import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";

import { adminListSubscribers } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/subscribers")({
  component: SubscribersPage,
});

type Sub = { id: number; email: string; active: boolean; createdAt: number };

function SubscribersPage() {
  const list = useServerFn(adminListSubscribers);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "subscribers"], queryFn: () => list() });
  const subs = (data ?? []) as Sub[];

  function copyList() {
    const txt = subs.map((s) => s.email).join("\n");
    navigator.clipboard.writeText(txt).then(
      () => toast.success(`Copied ${subs.length} emails`),
      () => toast.error("Clipboard unavailable"),
    );
  }

  function exportCsv() {
    const rows = [["email", "subscribed_at"], ...subs.map((s) => [s.email, new Date(s.createdAt).toISOString()])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `epiphany-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Newsletter Subscribers</h1>
          <p className="text-sm text-muted-foreground">Active subscribers receive every broadcast.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyList} disabled={!subs.length}>
            <Copy className="size-4" /> Copy emails
          </Button>
          <Button onClick={exportCsv} disabled={!subs.length}>
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total active</p>
          <p className="font-display text-4xl mt-2">{subs.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">This month</p>
          <p className="font-display text-4xl mt-2">
            {subs.filter((s) => new Date(s.createdAt).getMonth() === new Date().getMonth() && new Date(s.createdAt).getFullYear() === new Date().getFullYear()).length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Newest</p>
          <p className="font-display text-sm mt-2 truncate">{subs[0]?.email ?? "—"}</p>
        </Card>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Email</TableHead><TableHead>Subscribed</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>}
            {!isLoading && subs.length === 0 && (
              <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No subscribers yet.</TableCell></TableRow>
            )}
            {subs.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.email}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
