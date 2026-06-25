import { Link, Outlet, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, Mail, Megaphone, Users } from "lucide-react";
import { toast } from "sonner";

import { adminCheck, adminLogout } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Epiphany" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const { isAdmin } = await adminCheck();
    if (!isAdmin) throw redirect({ to: "/admin/login" });
  },
  component: AdminLayout,
});

const TABS = [
  { to: "/admin/messages", label: "Messages", icon: Mail },
  { to: "/admin/subscribers", label: "Subscribers", icon: Users },
  { to: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
] as const;

function AdminLayout() {
  const router = useRouter();
  const logout = useServerFn(adminLogout);

  async function onLogout() {
    await logout();
    toast.success("Signed out");
    await router.navigate({ to: "/admin/login" });
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-card">
        <div className="container-page py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-display text-xl">Epiphany</Link>
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Admin</span>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
        <nav className="container-page flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="px-4 py-3 text-sm border-b-2 border-transparent text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
              activeProps={{ className: "px-4 py-3 text-sm border-b-2 border-gold text-foreground font-medium inline-flex items-center gap-2" }}
            >
              <t.icon className="size-4" /> {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="container-page py-8">
        <Outlet />
      </main>
    </div>
  );
}
