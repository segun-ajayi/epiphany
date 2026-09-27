import { useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { prepareImageUpload } from "@/lib/admin/image";
import type { ServiceTime, SiteSettings } from "@/lib/site-settings/schemas";
import { SiteContentFields } from "./site-content-fields";

type SiteSettingsResponse = { settings: SiteSettings };

const identityFields: Array<[keyof SiteSettings, string, string?]> = [
  ["churchName", "Church name"],
  ["shortName", "Denomination / diocese wording"],
  ["tagline", "Tagline"],
  ["phone", "Public phone", "tel"],
  ["email", "Public email", "email"],
];

const addressFields: Array<[keyof SiteSettings, string]> = [
  ["addressLine1", "Street address"],
  ["addressLine2", "Suite or unit"],
  ["city", "City"],
  ["region", "State / region"],
  ["postalCode", "Postal code"],
  ["countryCode", "Two-letter country code"],
];

const socialFields: Array<[keyof SiteSettings, string]> = [
  ["facebookUrl", "Facebook URL"],
  ["instagramUrl", "Instagram URL"],
  ["youtubeUrl", "YouTube URL"],
];

const visitorFields: Array<[keyof SiteSettings, string, string]> = [
  ["visitorParking", "Parking and entrance", "Add only confirmed parking and entrance details."],
  [
    "visitorChildren",
    "Children and families",
    "Describe current nursery, Sunday school, or family arrangements.",
  ],
  [
    "visitorAccessibility",
    "Accessibility",
    "Describe confirmed access arrangements and how visitors can request help.",
  ],
  ["visitorServiceDuration", "Typical service duration", "For example: About 90 minutes."],
];

export function SiteSettingsManager() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [busy, setBusy] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/site-settings", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.headers.get("content-type")?.includes("application/json"))
        throw new Error("Your sign-in may have expired. Reload and sign in again.");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Site settings could not be loaded.");
      setSettings((body as SiteSettingsResponse).settings);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Site settings could not be loaded.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function setField<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateService(id: string, field: keyof ServiceTime, value: string) {
    if (!settings) return;
    setField(
      "serviceTimes",
      settings.serviceTimes.map((service) =>
        service.id === id ? { ...service, [field]: value } : service,
      ),
    );
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({ action: "save-settings", settings }),
      });
      if (!response.headers.get("content-type")?.includes("application/json"))
        throw new Error("Your sign-in may have expired. Reload and sign in again.");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Site settings could not be saved.");
      setField("revision", body.revision);
      setMessage("Site settings saved. Public pages now use these values.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Site settings could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadSocialImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("socialImage");
    if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const form = new FormData();
      form.set("image", await prepareImageUpload(input.files[0]));
      const response = await fetch("/api/admin/site-settings-media", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-Admin-Request": "1" },
        body: form,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The social image could not be uploaded.");
      setField("socialImagePath", body.path);
      input.value = "";
      setMessage("Image uploaded. Save settings to make it active.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The image could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  async function uploadManagedImage(file: File) {
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const form = new FormData();
      form.set("image", await prepareImageUpload(file));
      const response = await fetch("/api/admin/site-settings-media", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-Admin-Request": "1" },
        body: form,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The image could not be uploaded.");
      setMessage("Image uploaded. Save site settings to make it active.");
      return String(body.path);
    } catch (failure) {
      const uploadError =
        failure instanceof Error ? failure : new Error("The image could not be uploaded.");
      setError(uploadError.message);
      throw uploadError;
    } finally {
      setUploading(false);
    }
  }

  if (busy && !settings) return <p className="text-sm text-muted-foreground">Loading settings…</p>;
  if (!settings)
    return (
      <div className="rounded-xl border p-6">
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );

  return (
    <section aria-labelledby="site-settings-heading">
      <div className="rounded-2xl border bg-card p-6 md:p-8">
        <h2 id="site-settings-heading" className="font-display text-2xl">
          Site settings
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          These values control the public header, footer, contact details, visitor page, service
          times, and default search metadata.
        </p>
        {message && (
          <p role="status" className="mt-5 rounded-lg bg-secondary p-4 text-sm">
            {message}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <form onSubmit={save} className="mt-8 space-y-10">
          <fieldset disabled={busy} className="space-y-5">
            <legend className="font-display text-xl">Church identity and contact</legend>
            <div className="grid gap-5 md:grid-cols-2">
              {identityFields.map(([key, label, type]) => (
                <label key={key} className="grid gap-2 text-sm font-medium">
                  {label}
                  <Input
                    type={type || "text"}
                    required
                    value={String(settings[key])}
                    onChange={(event) => setField(key, event.target.value as never)}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset disabled={busy || uploading} className="space-y-5">
            <legend className="font-display text-xl">Public page content</legend>
            <p className="text-sm text-muted-foreground">
              Manage the homepage, About page, Visit page, testimonials, and their shared images.
            </p>
            <SiteContentFields
              settings={settings}
              disabled={busy || uploading}
              onChange={setSettings}
              onUpload={uploadManagedImage}
            />
          </fieldset>

          <fieldset disabled={busy} className="space-y-5">
            <legend className="font-display text-xl">Footer</legend>
            <label className="grid gap-2 text-sm font-medium">
              Footer quotation
              <Textarea
                rows={2}
                value={settings.footerQuote}
                onChange={(event) => setField("footerQuote", event.target.value)}
              />
            </label>
          </fieldset>

          <fieldset disabled={busy} className="space-y-5">
            <legend className="font-display text-xl">Location</legend>
            <div className="grid gap-5 md:grid-cols-2">
              {addressFields.map(([key, label]) => (
                <label key={key} className="grid gap-2 text-sm font-medium">
                  {label}
                  <Input
                    required={key !== "addressLine2"}
                    maxLength={key === "countryCode" ? 2 : undefined}
                    value={String(settings[key])}
                    onChange={(event) => setField(key, event.target.value as never)}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset disabled={busy} className="space-y-5">
            <legend className="font-display text-xl">Service times</legend>
            <div className="space-y-4">
              {settings.serviceTimes.map((service) => (
                <div
                  key={service.id}
                  className="grid gap-3 rounded-xl border p-4 md:grid-cols-2 lg:grid-cols-5"
                >
                  {(["day", "time", "title", "description"] as const).map((field) => (
                    <label
                      key={field}
                      className={`grid gap-2 text-sm font-medium ${field === "description" ? "lg:col-span-2" : ""}`}
                    >
                      {field === "day"
                        ? "Day"
                        : field === "time"
                          ? "Time"
                          : field === "title"
                            ? "Service name"
                            : "Description"}
                      <Input
                        required={field !== "description"}
                        value={service[field]}
                        onChange={(event) => updateService(service.id, field, event.target.value)}
                      />
                    </label>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={settings.serviceTimes.length === 1}
                    onClick={() =>
                      setField(
                        "serviceTimes",
                        settings.serviceTimes.filter((item) => item.id !== service.id),
                      )
                    }
                  >
                    <Trash2 className="size-4" /> Remove
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={settings.serviceTimes.length >= 12}
              onClick={() =>
                setField("serviceTimes", [
                  ...settings.serviceTimes,
                  { id: crypto.randomUUID(), day: "Sunday", time: "", title: "", description: "" },
                ])
              }
            >
              <Plus className="size-4" /> Add service time
            </Button>
          </fieldset>

          <fieldset disabled={busy} className="space-y-5">
            <legend className="font-display text-xl">Visitor information</legend>
            <div className="grid gap-5 md:grid-cols-2">
              {visitorFields.map(([key, label, help]) => (
                <label key={key} className="grid gap-2 text-sm font-medium">
                  {label}
                  <Textarea
                    rows={4}
                    value={String(settings[key])}
                    onChange={(event) => setField(key, event.target.value as never)}
                  />
                  <span className="text-xs font-normal text-muted-foreground">{help}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset disabled={busy} className="space-y-5">
            <legend className="font-display text-xl">Official social profiles</legend>
            <p className="text-sm text-muted-foreground">
              Blank profiles are hidden from the public footer.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              {socialFields.map(([key, label]) => (
                <label key={key} className="grid gap-2 text-sm font-medium">
                  {label}
                  <Input
                    type="url"
                    placeholder="https://"
                    value={String(settings[key])}
                    onChange={(event) => setField(key, event.target.value as never)}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset disabled={busy} className="space-y-5">
            <legend className="font-display text-xl">Default search and sharing</legend>
            <label className="grid gap-2 text-sm font-medium">
              Default search title
              <Input
                required
                maxLength={160}
                value={settings.defaultSeoTitle}
                onChange={(event) => setField("defaultSeoTitle", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Default search description
              <Textarea
                required
                maxLength={320}
                rows={3}
                value={settings.defaultSeoDescription}
                onChange={(event) => setField("defaultSeoDescription", event.target.value)}
              />
            </label>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
              <label className="grid gap-2 text-sm font-medium">
                Active social-sharing image
                <Input readOnly value={settings.socialImagePath} />
              </label>
              {settings.socialImagePath && (
                <img
                  src={settings.socialImagePath}
                  alt="Social-sharing preview"
                  className="aspect-[1.91/1] w-full rounded-lg border object-cover"
                />
              )}
            </div>
          </fieldset>

          <Button type="submit" disabled={busy || uploading}>
            {busy ? "Saving…" : "Save site settings"}
          </Button>
        </form>

        <form onSubmit={uploadSocialImage} className="mt-8 rounded-xl border border-dashed p-5">
          <label className="grid gap-2 text-sm font-medium">
            Upload a replacement social-sharing image
            <Input
              name="socialImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
            />
          </label>
          <p className="mt-2 text-xs text-muted-foreground">
            Recommended shape: 1200 × 630. The browser optimizes the file before upload.
          </p>
          <Button type="submit" variant="outline" className="mt-4" disabled={busy || uploading}>
            <Upload className="size-4" /> {uploading ? "Uploading…" : "Upload image"}
          </Button>
        </form>
      </div>
    </section>
  );
}
