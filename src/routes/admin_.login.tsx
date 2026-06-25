import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { adminLogin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin_/login")({
  head: () => ({ meta: [{ title: "Admin Login — Epiphany" }, { name: "robots", content: "noindex" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const router = useRouter();
  const login = useServerFn(adminLogin);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await login({ data: { password } });
      if (res.ok) {
        toast.success("Welcome back");
        await router.navigate({ to: "/admin/messages" });
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-12">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-elegant space-y-5">
        <div className="flex items-center gap-3">
          <span className="size-10 grid place-items-center rounded-full bg-primary text-primary-foreground">
            <Lock className="size-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl">Admin Sign In</h1>
            <p className="text-xs text-muted-foreground">Staff access only</p>
          </div>
        </div>
        <Input
          type="password"
          autoFocus
          required
          autoComplete="current-password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
