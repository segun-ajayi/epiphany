import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterSignup() {
  const startedAt = useRef(0);
  const [state, setState] = useState<"idle" | "sending" | "success">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Newsletter-Request": "1",
        },
        body: JSON.stringify({
          name: form.get("name") ?? "",
          email: form.get("email") ?? "",
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

  return (
    <section className="container-page pb-24" aria-labelledby="newsletter-heading">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-foreground shadow-elegant md:px-12 md:py-16">
        <div
          className="absolute -right-24 -top-28 size-80 rounded-full border border-gold/20 bg-gold/10"
          aria-hidden
        />
        <div
          className="absolute -bottom-36 -left-24 size-80 rounded-full border border-white/10"
          aria-hidden
        />
        <div className="relative grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Mail className="size-6" aria-hidden />
            </span>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-gold">
              The Epiphany Letter
            </p>
            <h2 id="newsletter-heading" className="mt-3 font-display text-3xl md:text-5xl">
              Faith for the week ahead
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75 md:text-base">
              Receive upcoming events, parish news, and a thoughtful word of encouragement in your
              inbox.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm md:p-7">
            {state === "success" ? (
              <div className="py-5 text-center" role="status">
                <CheckCircle2 className="mx-auto size-11 text-gold" aria-hidden />
                <h3 className="mt-4 font-display text-2xl">You’re on the list</h3>
                <p className="mt-2 text-sm text-white/75">
                  Thank you — your subscription has been recorded.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} aria-describedby="newsletter-privacy newsletter-error">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Name <span className="sr-only">(optional)</span>
                    <Input
                      name="name"
                      autoComplete="name"
                      maxLength={120}
                      placeholder="Your name (optional)"
                      className="h-12 border-white/20 bg-white text-foreground placeholder:text-muted-foreground"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Email address
                    <Input
                      name="email"
                      required
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      placeholder="you@example.com"
                      className="h-12 border-white/20 bg-white text-foreground placeholder:text-muted-foreground"
                    />
                  </label>
                </div>
                <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-white/80">
                  <input
                    name="consent"
                    value="yes"
                    required
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0 accent-[#D4AF37]"
                  />
                  <span>
                    Yes, I’d like to receive parish news and event updates from Anglican Church of
                    the Epiphany.
                  </span>
                </label>
                <div className="absolute -left-[10000px]" aria-hidden="true">
                  <label>
                    Website
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
                {error && (
                  <p id="newsletter-error" role="alert" className="mt-4 text-sm text-amber-200">
                    {error}
                  </p>
                )}
                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    disabled={state === "sending"}
                    className="shrink-0"
                  >
                    {state === "sending" ? "Subscribing…" : "Join the newsletter"}
                    {state !== "sending" && <Send className="size-4" aria-hidden />}
                  </Button>
                  <p id="newsletter-privacy" className="text-xs leading-relaxed text-white/60">
                    Weekly at most. Unsubscribe from any newsletter. We use your details only for
                    church communications and share them only with our selected email delivery
                    provider.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
