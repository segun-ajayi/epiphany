import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LockKeyhole, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentEditor } from "@/components/admin/content-editor";
import { NewsletterManager } from "@/components/admin/newsletter-manager";
import { TeamManager } from "@/components/admin/team-manager";
import { GivingManager } from "@/components/admin/giving-manager";
import { SiteSettingsManager } from "@/components/admin/site-settings-manager";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { ContactManager } from "@/components/admin/contact-manager";
import { RegistrationManager } from "@/components/admin/registration-manager";
import { LeadershipManager } from "@/components/admin/leadership-manager";
import { LoginForm } from "@/components/admin/login-form";
import { submitAuth } from "@/lib/api/auth.requests";
import { getAdminScreen } from "@/lib/api/admin.functions";
import { canPublish } from "@/lib/auth/permissions";
import type { ContentKind, AdminMinistry, AdminEvent, AdminSermon } from "@/lib/admin/schemas";
import type { AdminContent } from "@/lib/admin/repository.server";

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>): { signin?: string } => ({
    signin:
      typeof search.signin === "string" &&
      ["cancelled", "expired", "denied", "unconfigured", "failed"].includes(search.signin)
        ? search.signin
        : undefined,
  }),
  loader: () => getAdminScreen(),
  staleTime: 0,
  gcTime: 0,
  head: () => ({
    meta: [
      { title: "Administration — Epiphany" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const screen = Route.useLoaderData();
  const { signin } = Route.useSearch();
  if (screen.state === "blocked")
    return (
      <section className="container-page py-24">
        <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center">
          <LockKeyhole className="mx-auto size-10 text-burgundy" aria-hidden />
          <h1 className="mt-5 font-display text-3xl">Administrator sign-in</h1>
          {screen.error.status !== 401 && (
            <p className="mt-4 text-muted-foreground">{screen.error.message}</p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in with your approved church account to manage content.
          </p>
          <LoginForm result={signin} />
          <Button asChild className="mt-6">
            <Link to="/">Return to the website</Link>
          </Button>
        </div>
      </section>
    );
  return <AdminWorkspace initial={screen.data} />;
}

function AdminWorkspace({ initial }: { initial: AdminContent }) {
  const [data, setData] = useState(initial);
  const [activeSection, setActiveSection] = useState<
    | ContentKind
    | "gallery"
    | "contact"
    | "registrations"
    | "leadership"
    | "settings"
    | "newsletter"
    | "giving"
    | "team"
  >("ministry");
  const [editing, setEditing] = useState<{
    kind: ContentKind;
    record?: AdminMinistry | AdminEvent | AdminSermon;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const newsletterOpen = activeSection === "newsletter";
  const teamOpen = activeSection === "team";
  const givingOpen = activeSection === "giving";
  const settingsOpen = activeSection === "settings";
  const galleryOpen = activeSection === "gallery";
  const contactOpen = activeSection === "contact";
  const registrationsOpen = activeSection === "registrations";
  const leadershipOpen = activeSection === "leadership";
  const kind: ContentKind =
    activeSection === "event" ? "event" : activeSection === "sermon" ? "sermon" : "ministry";
  const records =
    kind === "ministry" ? data.ministries : kind === "event" ? data.events : data.sermons;
  const total =
    kind === "ministry"
      ? data.totals.ministries
      : kind === "event"
        ? data.totals.events
        : data.totals.sermons;

  async function refresh(page = data.page) {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/content?page=${page}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok || !response.headers.get("content-type")?.includes("application/json"))
        throw new Error("Unable to refresh. Reload the page to verify your sign-in.");
      setData(await response.json());
    } finally {
      setBusy(false);
    }
  }

  function loadPage(page: number) {
    setMessage("");
    void refresh(page).catch((error) => setMessage(error.message));
  }

  return (
    <div className="container-page py-12 md:py-20">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="flex items-center gap-2 text-sm text-burgundy">
            <ShieldCheck className="size-4" /> Church administration
          </p>
          <h1 className="mt-2 font-display text-4xl">Church workspace</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {data.user.email} · {data.user.role}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await submitAuth("logout", {});
                window.location.assign("/admin");
              } catch {
                setMessage("Sign out failed. Please try again.");
                setBusy(false);
              }
            }}
          >
            Sign out
          </Button>
        </div>
      </header>
      <div className="my-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Ministries</p>
          <p className="mt-2 text-3xl font-semibold">{data.totals.ministries}</p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Sermons</p>
          <p className="mt-2 text-3xl font-semibold">{data.totals.sermons}</p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Events</p>
          <p className="mt-2 text-3xl font-semibold">{data.totals.events}</p>
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-2xl border bg-card p-3 lg:sticky lg:top-24">
          <nav
            aria-label="Administration sections"
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1 [&>button]:justify-start"
          >
            <p className="col-span-2 px-3 pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:col-span-3 lg:col-span-1">
              Content
            </p>
            {(["ministry", "event", "sermon"] as const).map((item) => (
              <Button
                key={item}
                variant={activeSection === item ? "default" : "outline"}
                disabled={busy}
                aria-pressed={activeSection === item}
                onClick={() => {
                  setActiveSection(item);
                  setEditing(null);
                  loadPage(0);
                }}
              >
                {item === "ministry" ? "Ministries" : item === "event" ? "Events" : "Sermons"}
              </Button>
            ))}
            <Button
              variant={galleryOpen ? "default" : "outline"}
              disabled={busy}
              aria-pressed={galleryOpen}
              onClick={() => {
                setActiveSection("gallery");
                setEditing(null);
                setMessage("");
              }}
            >
              Gallery
            </Button>
            <Button
              variant={leadershipOpen ? "default" : "outline"}
              disabled={busy}
              aria-pressed={leadershipOpen}
              onClick={() => {
                setActiveSection("leadership");
                setEditing(null);
                setMessage("");
              }}
            >
              Leadership
            </Button>
            {data.user.role === "administrator" && (
              <>
                <p className="col-span-2 px-3 pt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:col-span-3 lg:col-span-1">
                  Engagement
                </p>
                <Button
                  variant={contactOpen ? "default" : "outline"}
                  disabled={busy}
                  aria-pressed={contactOpen}
                  onClick={() => {
                    setActiveSection("contact");
                    setEditing(null);
                    setMessage("");
                  }}
                >
                  Messages
                </Button>
                <Button
                  variant={registrationsOpen ? "default" : "outline"}
                  disabled={busy}
                  aria-pressed={registrationsOpen}
                  onClick={() => {
                    setActiveSection("registrations");
                    setEditing(null);
                    setMessage("");
                  }}
                >
                  Registrations
                </Button>
                <Button
                  variant={givingOpen ? "default" : "outline"}
                  disabled={busy}
                  aria-pressed={givingOpen}
                  onClick={() => {
                    setActiveSection("giving");
                    setEditing(null);
                    setMessage("");
                  }}
                >
                  Giving
                </Button>
                <Button
                  variant={newsletterOpen ? "default" : "outline"}
                  disabled={busy}
                  aria-pressed={newsletterOpen}
                  onClick={() => {
                    setActiveSection("newsletter");
                    setEditing(null);
                    setMessage("");
                  }}
                >
                  Newsletter
                </Button>
                <p className="col-span-2 px-3 pt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:col-span-3 lg:col-span-1">
                  Configuration
                </p>
                <Button
                  variant={settingsOpen ? "default" : "outline"}
                  disabled={busy}
                  aria-pressed={settingsOpen}
                  onClick={() => {
                    setActiveSection("settings");
                    setEditing(null);
                    setMessage("");
                  }}
                >
                  Site & pages
                </Button>
                <Button
                  variant={teamOpen ? "default" : "outline"}
                  disabled={busy}
                  aria-pressed={teamOpen}
                  onClick={() => {
                    setActiveSection("team");
                    setEditing(null);
                    setMessage("");
                  }}
                >
                  Team
                </Button>
              </>
            )}
          </nav>
        </aside>
        <div className="min-w-0">
          <div className="mb-6 flex justify-end">
            {!galleryOpen &&
              !leadershipOpen &&
              !contactOpen &&
              !registrationsOpen &&
              !settingsOpen &&
              !newsletterOpen &&
              !givingOpen &&
              !teamOpen && (
                <Button variant="outline" disabled={busy} onClick={() => setEditing({ kind })}>
                  <Plus className="size-4" /> Add {kind}
                </Button>
              )}
          </div>
          {message && (
            <p role="status" className="mb-5 rounded-xl bg-secondary p-4 text-sm">
              {message}
            </p>
          )}
          {galleryOpen ? (
            <GalleryManager role={data.user.role} />
          ) : leadershipOpen ? (
            <LeadershipManager role={data.user.role} />
          ) : contactOpen ? (
            <ContactManager />
          ) : registrationsOpen ? (
            <RegistrationManager />
          ) : settingsOpen ? (
            <SiteSettingsManager />
          ) : newsletterOpen ? (
            <NewsletterManager />
          ) : givingOpen ? (
            <GivingManager />
          ) : teamOpen ? (
            <TeamManager />
          ) : editing ? (
            <ContentEditor
              key={`${editing.kind}-${editing.record?.id || "new"}`}
              {...editing}
              user={data.user}
              onClose={() => setEditing(null)}
              onSaved={async (result) => {
                setEditing(null);
                setMessage(
                  result.newsletterQueued
                    ? "Published successfully. Its event newsletter is queued for automatic delivery."
                    : "Saved successfully. Public pages show only published records whose publication time has arrived.",
                );
                try {
                  await refresh();
                } catch {
                  setMessage(
                    "Saved successfully, but the list could not refresh. Reload before editing again.",
                  );
                }
              }}
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border" aria-busy={busy}>
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">
                    Manage{" "}
                    {kind === "ministry" ? "ministries" : kind === "event" ? "events" : "sermons"}
                  </caption>
                  <thead className="bg-secondary">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-t">
                        <td className="p-4">
                          <p className="font-medium">
                            {"name" in record ? record.name : record.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{record.slug}</p>
                        </td>
                        <td className="p-4">
                          {record.status === "published" &&
                          record.published_at &&
                          record.published_at > new Date().toISOString()
                            ? "scheduled"
                            : record.status}
                        </td>
                        <td className="p-4">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={
                              busy || (!canPublish(data.user.role) && record.status !== "draft")
                            }
                            onClick={() => setEditing({ kind, record })}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!records.length && (
                  <p className="p-8 text-center text-muted-foreground">
                    No records on this page. Add a draft to get started.
                  </p>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <Button
                  variant="outline"
                  disabled={busy || data.page === 0}
                  onClick={() => loadPage(data.page - 1)}
                >
                  Previous
                </Button>
                <span>Page {data.page + 1}</span>
                <Button
                  variant="outline"
                  disabled={busy || (data.page + 1) * data.pageSize >= total}
                  onClick={() => loadPage(data.page + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
          {data.user.role === "administrator" && (
            <details className="group mt-12 rounded-2xl border bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-display text-2xl marker:hidden md:p-6">
                <span>Recent activity</span>
                <span
                  aria-hidden="true"
                  className="text-base text-muted-foreground transition-transform group-open:rotate-180"
                >
                  ▾
                </span>
              </summary>
              <ul className="divide-y border-t px-5 md:px-6">
                {data.audit.map((entry, index) => (
                  <li key={`${entry.created_at}-${index}`} className="py-4 text-sm">
                    <p>
                      {entry.action} · {entry.content_type} · {entry.summary}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.actor_email} · {entry.created_at}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
