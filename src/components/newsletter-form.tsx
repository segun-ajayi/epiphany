import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { subscribeNewsletter } from "@/lib/forms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm({ variant = "footer" }: { variant?: "footer" | "inline" }) {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await subscribe({ data: { email } });
      if (res.alreadySubscribed) toast.success("You're already subscribed — thank you!");
      else toast.success("Subscribed! Watch your inbox for updates.");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Subscription failed");
    } finally {
      setPending(false);
    }
  }

  const inputCls = variant === "footer"
    ? "bg-white/10 border-white/20 placeholder:text-white/60 text-white"
    : "";

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputCls}
        aria-label="Email address"
      />
      <Button type="submit" variant={variant === "footer" ? "gold" : "default"} disabled={pending}>
        {pending ? "…" : "Subscribe"}
      </Button>
    </form>
  );
}
