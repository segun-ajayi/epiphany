import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { canPublish, type AdminUser } from "@/lib/auth/permissions";
import type { AdminEvent, AdminMinistry, AdminSermon, ContentKind } from "@/lib/admin/schemas";
import { prepareImageUpload } from "@/lib/admin/image";
import { contentSlug } from "@/lib/content/slug";
import { houstonInputToIso, isoToHoustonInput } from "@/lib/content/datetime";

type Field = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
};
const commonFields: Field[] = [
  { name: "summary", label: "Short summary" },
  { name: "image_alt", label: "Image description" },
  { name: "seo_title", label: "Search title (optional)" },
  { name: "seo_description", label: "Search description (optional)" },
  {
    name: "published_at",
    label: "Publication date and time — Houston (optional)",
    type: "datetime-local",
  },
];
const ministryFields: Field[] = [
  { name: "name", label: "Ministry name", required: true },
  { name: "meeting_schedule", label: "Meeting schedule" },
  { name: "meeting_location", label: "Meeting location" },
  { name: "leader_name", label: "Leader" },
  { name: "leader_title", label: "Leader role or title" },
  { name: "contact_email", label: "Contact email", type: "email" },
  { name: "contact_phone", label: "Contact phone", type: "tel" },
  { name: "audience", label: "Who this ministry serves" },
  { name: "display_order", label: "Display order", type: "number", required: true },
];
const eventFields: Field[] = [
  { name: "title", label: "Event title", required: true },
  {
    name: "starts_at",
    label: "Start date, time and UTC offset",
    required: true,
    placeholder: "2026-10-11T10:30:00-05:00",
  },
  {
    name: "ends_at",
    label: "End date, time and UTC offset",
    placeholder: "2026-10-11T12:00:00-05:00",
  },
  { name: "timezone", label: "Display timezone", required: true },
  { name: "venue_name", label: "Venue" },
  { name: "address_line_1", label: "Street address" },
  { name: "address_line_2", label: "Suite or unit" },
  { name: "locality", label: "City" },
  { name: "region", label: "State" },
  { name: "postal_code", label: "Postal code" },
  { name: "country_code", label: "Two-letter country code", required: true },
  { name: "contact_name", label: "Contact name" },
  { name: "contact_email", label: "Contact email", type: "email" },
  { name: "capacity", label: "Capacity (optional)", type: "number" },
];
const sermonFields: Field[] = [
  { name: "title", label: "Sermon title", required: true },
  { name: "speaker", label: "Preacher or speaker", required: true },
  { name: "sermon_date", label: "Sermon date", type: "date", required: true },
  { name: "scripture", label: "Bible passage", required: true },
  { name: "series", label: "Series" },
  { name: "topic", label: "Topic" },
  { name: "youtube_url", label: "YouTube URL", type: "url" },
  { name: "audio_url", label: "External audio URL", type: "url" },
  { name: "notes_url", label: "Sermon notes URL or local path" },
  { name: "duration_seconds", label: "Duration in seconds", type: "number" },
];

export function ContentEditor({
  kind,
  record,
  user,
  onSaved,
  onClose,
}: {
  kind: ContentKind;
  record?: AdminMinistry | AdminEvent | AdminSermon;
  user: AdminUser;
  onSaved: (result: { newsletterQueued?: boolean }) => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const titleField = kind === "ministry" ? "name" : "title";
  const [sourceName, setSourceName] = useState(
    String(record?.[titleField as keyof typeof record] ?? ""),
  );
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [removeNotes, setRemoveNotes] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const notesInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{
    title: string;
    summary: string;
    description: string;
  } | null>(null);
  const defaults: Record<string, unknown> = {
    display_order: 0,
    timezone: "America/Chicago",
    country_code: "US",
    ...record,
  };
  const fields = [
    ...(kind === "ministry" ? ministryFields : kind === "event" ? eventFields : sermonFields),
    ...commonFields,
  ];
  const generatedSlug = record?.published_at ? record.slug : contentSlug(sourceName);
  const visibleImage = localImagePreview || (!removeImage ? record?.image_path : null);

  useEffect(
    () => () => {
      if (localImagePreview) URL.revokeObjectURL(localImagePreview);
    },
    [localImagePreview],
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const selectedImage = form.get("image");
    const selectedNotes = form.get("notes");
    form.delete("image");
    form.delete("notes");
    form.delete("remove_image");
    form.delete("remove_notes");
    const values = Object.fromEntries(form.entries());
    values.slug = generatedSlug;
    setBusy(true);
    setError("");
    try {
      if (typeof values.published_at === "string" && values.published_at) {
        values.published_at = houstonInputToIso(values.published_at);
      }
      const payload = {
        kind,
        ...(record ? { id: record.id, revision: record.revision } : {}),
        remove_image: removeImage,
        remove_notes: removeNotes,
        record: values,
      };
      const submission = new FormData();
      submission.set("payload", JSON.stringify(payload));
      if (selectedImage instanceof File && selectedImage.size) {
        submission.set("image", await prepareImageUpload(selectedImage));
      }
      if (selectedNotes instanceof File && selectedNotes.size) {
        submission.set("notes", selectedNotes);
      }
      const response = await fetch("/api/admin/content", {
        method: record ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "X-Admin-Request": "1" },
        body: submission,
      });
      if (!response.headers.get("content-type")?.includes("application/json"))
        throw new Error("Your sign-in may have expired. Reload and sign in again.");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The record could not be saved.");
      await onSaved(result);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The record could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="rounded-2xl border border-border bg-card p-6 md:p-8"
      aria-labelledby="editor-title"
    >
      <h2 id="editor-title" className="font-display text-2xl">
        {record ? "Edit" : "New"} {kind}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Save a draft first. Publishing makes the content visible to everyone. Archive removes it
        from public listings without deleting its history.
      </p>
      <form onSubmit={save} className="mt-6 space-y-6">
        <input type="hidden" name="image_path" value={record?.image_path || ""} />
        <input type="hidden" name="social_image_path" value={record?.social_image_path || ""} />
        <fieldset disabled={busy} className="grid gap-5 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.name} className="grid gap-2 text-sm font-medium">
              {field.label}
              <Input
                name={field.name}
                type={field.type || "text"}
                required={field.required}
                min={field.type === "number" ? (field.name === "capacity" ? 1 : 0) : undefined}
                placeholder={field.placeholder}
                {...(field.name === titleField
                  ? { value: sourceName, onChange: (event) => setSourceName(event.target.value) }
                  : {
                      defaultValue:
                        field.name === "published_at"
                          ? isoToHoustonInput(String(defaults[field.name] ?? ""))
                          : String(defaults[field.name] ?? ""),
                    })}
              />
            </label>
          ))}
          <div className="grid gap-3 md:col-span-2">
            <div>
              <p className="text-sm font-medium">URL</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                /{kind === "ministry" ? "ministries" : kind === "event" ? "events" : "sermons"}/
                {generatedSlug}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {record?.published_at
                  ? "This published URL is permanent."
                  : "Generated from the name; a number is added automatically if it is already used."}
              </p>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              Image
              <Input
                ref={imageInput}
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setRemoveImage(false);
                  setLocalImagePreview(file ? URL.createObjectURL(file) : null);
                }}
              />
              <span className="text-xs font-normal text-muted-foreground">
                Choose a JPG, PNG or WebP file. It will be resized and optimized before upload.
              </span>
            </label>
            {visibleImage && (
              <img
                src={visibleImage}
                alt="Selected content preview"
                className="max-h-64 w-full rounded-xl border object-cover"
              />
            )}
            {(record?.image_path || localImagePreview) && (
              <label className="flex items-center gap-2 text-sm font-normal">
                <input
                  name="remove_image"
                  type="checkbox"
                  checked={removeImage}
                  onChange={(event) => {
                    setRemoveImage(event.target.checked);
                    if (event.target.checked) {
                      if (imageInput.current) imageInput.current.value = "";
                      setLocalImagePreview(null);
                    }
                  }}
                />
                Remove the image when saving
              </label>
            )}
          </div>
          {kind === "sermon" && (
            <div className="grid gap-3 md:col-span-2">
              <label className="grid gap-2 text-sm font-medium">
                Upload sermon notes PDF
                <Input
                  ref={notesInput}
                  name="notes"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => {
                    if (event.target.files?.[0]) setRemoveNotes(false);
                  }}
                />
                <span className="text-xs font-normal text-muted-foreground">
                  PDF only, maximum 1.25 MB. An uploaded PDF replaces the notes URL above.
                </span>
              </label>
              {record && "notes_url" in record && record.notes_url && !removeNotes && (
                <a
                  href={record.notes_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-burgundy underline underline-offset-4"
                >
                  Open current sermon notes
                </a>
              )}
              {record && "notes_url" in record && record.notes_url && (
                <label className="flex items-center gap-2 text-sm font-normal">
                  <input
                    name="remove_notes"
                    type="checkbox"
                    checked={removeNotes}
                    onChange={(event) => {
                      setRemoveNotes(event.target.checked);
                      if (event.target.checked && notesInput.current) notesInput.current.value = "";
                    }}
                  />
                  Remove sermon notes when saving
                </label>
              )}
            </div>
          )}
          <label className="grid gap-2 text-sm font-medium md:col-span-2">
            Full description (plain text)
            <Textarea name="description" defaultValue={record?.description || ""} rows={8} />
          </label>
          {kind === "ministry" && (
            <>
              <label className="grid gap-2 text-sm font-medium md:col-span-2">
                What newcomers should expect
                <Textarea
                  name="what_to_expect"
                  defaultValue={String(defaults.what_to_expect || "")}
                  rows={4}
                  placeholder="Explain what happens at a typical gathering and what a first-time visitor should know."
                />
              </label>
              <label className="grid gap-2 text-sm font-medium md:col-span-2">
                How to join or get involved
                <Textarea
                  name="join_instructions"
                  defaultValue={String(defaults.join_instructions || "")}
                  rows={4}
                  placeholder="Give a clear next step, such as who to contact or where to meet."
                />
              </label>
            </>
          )}
          <label className="grid gap-2 text-sm font-medium">
            Publication status
            <select
              name="status"
              defaultValue={record?.status || "draft"}
              className="h-10 rounded-md border bg-background px-3"
            >
              <option value="draft">Draft</option>
              {canPublish(user.role) && (
                <>
                  <option value="published">Published / scheduled</option>
                  {kind === "event" && <option value="cancelled">Cancelled</option>}
                  <option value="archived">Archived</option>
                </>
              )}
            </select>
          </label>
          {kind === "event" && (
            <>
              <label className="grid gap-2 text-sm font-medium">
                Category
                <select
                  name="category"
                  defaultValue={String(defaults.category || "Fellowship")}
                  className="h-10 rounded-md border bg-background px-3"
                >
                  {["Worship", "Fellowship", "Outreach", "Youth", "Bible Study"].map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Registration
                <select
                  name="registration_status"
                  defaultValue={String(defaults.registration_status || "not_required")}
                  className="h-10 rounded-md border bg-background px-3"
                >
                  <option value="not_required">No registration needed</option>
                  <option value="open">Registration required — open</option>
                  <option value="closed">Registration required — closed</option>
                  <option value="full">Registration required — full</option>
                </select>
              </label>
              <p className="text-sm text-muted-foreground md:col-span-2">
                Times require an explicit offset: for example, 2026-10-11T10:30:00-05:00. Houston
                uses -05:00 during daylight saving time and -06:00 otherwise. Keep “No registration
                needed” for normal open events; select an option marked “Registration required” only
                when attendee sign-up is necessary.
              </p>
            </>
          )}
          {kind === "sermon" && (
            <p className="text-sm text-muted-foreground md:col-span-2">
              Add at least a YouTube or external audio URL before publishing. Recordings remain on
              the media provider; this website stores only the link and optimized thumbnail.
            </p>
          )}
        </fieldset>
        <p className="text-sm text-muted-foreground">
          Leave publication time blank to publish immediately; choose a future Houston date and time
          to schedule. The uploaded image is also used for social sharing. Published URLs remain
          unchanged when the name is edited.
        </p>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={(event) => {
              const form = event.currentTarget.form;
              if (!form) return;
              const values = new FormData(form);
              setPreview({
                title: String(values.get(kind === "ministry" ? "name" : "title") || "Untitled"),
                summary: String(values.get("summary") || ""),
                description: String(values.get("description") || ""),
              });
            }}
          >
            Preview text
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
      {preview && (
        <aside
          className="mt-8 rounded-xl border border-dashed p-6"
          aria-label="Private content preview"
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Private text preview — not published
          </p>
          <h3 className="mt-3 font-display text-2xl">{preview.title}</h3>
          <p className="mt-3 font-medium">{preview.summary}</p>
          <p className="mt-4 whitespace-pre-wrap">{preview.description}</p>
        </aside>
      )}
    </section>
  );
}
