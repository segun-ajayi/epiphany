import { useState } from "react";
import { submitAuth } from "@/lib/api/auth.requests";

const messages: Record<string, string> = {
  cancelled: "Sign-in was cancelled. You can try again when you are ready.",
  expired: "This sign-in attempt expired or was already used. Please start again.",
  denied: "This Google account is not approved for church administration.",
  unconfigured:
    "Google sign-in is not connected yet. The site owner needs to complete Google setup.",
  failed: "We could not complete Google sign-in. Please try again.",
};

export function LoginForm({ result }: { result?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const message = error || (result ? messages[result] : "");
  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const response = await submitAuth("google", {});
      const url = new URL(response.url);
      if (url.origin !== "https://accounts.google.com" || url.pathname !== "/o/oauth2/v2/auth")
        throw new Error("The sign-in service returned an invalid address.");
      window.location.assign(url.href);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Sign-in is unavailable. Please try again.",
      );
      setBusy(false);
    }
  }
  return (
    <div className="mt-6 space-y-4">
      <button
        type="button"
        disabled={busy}
        onClick={() => void signIn()}
        className="inline-flex min-h-10 items-center justify-center gap-3 rounded border border-[#747775] bg-white px-3 py-2 text-sm font-medium text-[#1f1f1f] hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-60"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.03 46.98 31.87 46.98 24.55Z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.78-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
          />
        </svg>
        {busy ? "Connecting…" : "Sign in with Google"}
      </button>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Only approved administrators can enter. Your Google password stays with Google. Visitors do
        not need to sign in.
      </p>
      {message && (
        <p role="alert" className="rounded-lg bg-secondary p-3 text-sm">
          {message}
        </p>
      )}
    </div>
  );
}
