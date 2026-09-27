import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin_/reset-password")({
  head: () => ({
    meta: [
      { title: "Sign-in has changed — Epiphany" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RetiredPasswordSetup,
});

function RetiredPasswordSetup() {
  useEffect(() => {
    // Remove any legacy recovery fragment without reading or sending its value.
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  return (
    <section className="container-page py-24 text-center">
      <h1 className="font-display text-3xl">Sign-in has changed</h1>
      <p className="mt-4">
        Password setup links are no longer used. Approved administrators now sign in with Google.
      </p>
      <Link to="/admin" className="mt-6 inline-block underline">
        Go to administrator sign-in
      </Link>
    </section>
  );
}
