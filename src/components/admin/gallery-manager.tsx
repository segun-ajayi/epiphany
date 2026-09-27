import { useEffect, useState, type FormEvent } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { prepareGalleryImageUpload } from "@/lib/admin/image";
import { canPublish, type AdminRole } from "@/lib/auth/permissions";
import type {
  AdminGalleryAlbum,
  AdminGalleryPhoto,
  GalleryAlbumInput,
} from "@/lib/gallery/schemas";
import { houstonInputToIso, isoToHoustonInput } from "@/lib/content/datetime";

type GalleryResponse = {
  albums: AdminGalleryAlbum[];
  limits: { photosPerAlbum: number; fullImageBytes: number; thumbnailBytes: number };
};

const emptyAlbum: GalleryAlbumInput = {
  title: "",
  summary: "",
  description: "",
  event_date: null,
  related_event_slug: null,
  related_ministry_slug: null,
  status: "draft",
  display_order: 0,
  seo_title: null,
  seo_description: null,
  published_at: null,
};

function editableAlbum(album: AdminGalleryAlbum): GalleryAlbumInput {
  return {
    title: album.title,
    summary: album.summary,
    description: album.description,
    event_date: album.event_date,
    related_event_slug: album.related_event_slug,
    related_ministry_slug: album.related_ministry_slug,
    status: album.status,
    display_order: album.display_order,
    seo_title: album.seo_title,
    seo_description: album.seo_description,
    published_at: album.published_at,
  };
}

function cleanFileName(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function jsonRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...init });
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error("Your sign-in may have expired. Reload and sign in again.");
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "The gallery could not be updated.");
  return body;
}

export function GalleryManager({ role }: { role: AdminRole }) {
  const [data, setData] = useState<GalleryResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GalleryAlbumInput>(emptyAlbum);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selected = data?.albums.find((album) => album.id === selectedId) ?? null;

  async function load(preferredId?: string) {
    setBusy(true);
    try {
      const result = (await jsonRequest("/api/admin/gallery")) as GalleryResponse;
      setData(result);
      if (preferredId) {
        const album = result.albums.find((item) => item.id === preferredId);
        if (album) {
          setSelectedId(album.id);
          setDraft(editableAlbum(album));
        }
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The gallery could not be loaded.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function choose(album: AdminGalleryAlbum | null) {
    setSelectedId(album?.id ?? null);
    setDraft(album ? editableAlbum(album) : { ...emptyAlbum });
    setMessage("");
    setError("");
  }

  function field<K extends keyof GalleryAlbumInput>(key: K, value: GalleryAlbumInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveAlbum(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const result = await jsonRequest("/api/admin/gallery", {
        method: selected ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({
          action: "save-album",
          ...(selected ? { id: selected.id, revision: selected.revision } : {}),
          album: draft,
        }),
      });
      await load(result.id);
      setMessage(selected ? "Album saved." : "Album created. You can now add photos.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The album could not be saved.");
      setBusy(false);
    }
  }

  async function uploadPhotos(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const input = event.currentTarget.elements.namedItem("photos");
    if (!(input instanceof HTMLInputElement) || !input.files?.length) return;
    const files = Array.from(input.files);
    setBusy(true);
    setMessage("");
    setError("");
    let uploaded = 0;
    try {
      for (const file of files) {
        const form = new FormData();
        form.set("albumId", selected.id);
        form.set("alt", cleanFileName(file.name) || selected.title);
        form.set("caption", "");
        const prepared = await prepareGalleryImageUpload(file);
        form.set("image", prepared.image);
        form.set("thumbnail", prepared.thumbnail);
        form.set("width", String(prepared.width));
        form.set("height", String(prepared.height));
        await jsonRequest("/api/admin/gallery-media", {
          method: "POST",
          headers: { "X-Admin-Request": "1" },
          body: form,
        });
        uploaded += 1;
      }
      input.value = "";
      await load(selected.id);
      setMessage(
        `${uploaded} photo${uploaded === 1 ? "" : "s"} uploaded. Review each description before publishing.`,
      );
    } catch (failure) {
      await load(selected.id);
      setError(
        `${uploaded ? `${uploaded} uploaded. ` : ""}${failure instanceof Error ? failure.message : "The upload failed."}`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function updatePhoto(photo: AdminGalleryPhoto, changes: Partial<AdminGalleryPhoto>) {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await jsonRequest("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({
          action: "update-photo",
          id: photo.id,
          revision: photo.revision,
          image_alt: changes.image_alt ?? photo.image_alt,
          caption: changes.caption ?? photo.caption,
          display_order: changes.display_order ?? photo.display_order,
          featured: Boolean(changes.featured ?? photo.featured),
        }),
      });
      await load(selected.id);
      setMessage("Photo details saved.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The photo could not be saved.");
      setBusy(false);
    }
  }

  async function removePhoto(photo: AdminGalleryPhoto) {
    if (!selected || !window.confirm("Remove this photo permanently?")) return;
    setBusy(true);
    setError("");
    try {
      await jsonRequest("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({ action: "remove-photo", id: photo.id, revision: photo.revision }),
      });
      await load(selected.id);
      setMessage("Photo removed.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The photo could not be removed.");
      setBusy(false);
    }
  }

  if (busy && !data) return <p className="text-sm text-muted-foreground">Loading gallery…</p>;
  if (!data)
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );

  return (
    <section
      aria-labelledby="gallery-manager-heading"
      className="grid gap-8 lg:grid-cols-[18rem_1fr]"
    >
      <aside>
        <div className="flex items-center justify-between gap-3">
          <h2 id="gallery-manager-heading" className="font-display text-2xl">
            Albums
          </h2>
          <Button size="sm" variant="outline" onClick={() => choose(null)} disabled={busy}>
            <Plus className="size-4" /> New
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {!data.albums.length && <p className="text-sm text-muted-foreground">No albums yet.</p>}
          {data.albums.map((album) => (
            <button
              key={album.id}
              type="button"
              onClick={() => choose(album)}
              className={`w-full rounded-xl border p-4 text-left transition ${selectedId === album.id ? "border-primary bg-secondary" : "hover:bg-secondary/60"}`}
            >
              <span className="block font-medium">{album.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {album.status} · {album.photo_count} photo{album.photo_count === 1 ? "" : "s"}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="min-w-0">
        {message && (
          <p role="status" className="mb-5 rounded-lg bg-secondary p-4 text-sm">
            {message}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <form onSubmit={saveAlbum} className="rounded-2xl border bg-card p-6 md:p-8">
          <h3 className="font-display text-2xl">{selected ? "Edit album" : "Create album"}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The public URL is generated automatically from the title and remains stable after
            publication.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Title</span>
              <Input
                required
                minLength={2}
                maxLength={120}
                value={draft.title}
                onChange={(e) => field("title", e.target.value)}
              />
            </label>
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Summary</span>
              <Textarea
                required
                minLength={10}
                maxLength={300}
                value={draft.summary}
                onChange={(e) => field("summary", e.target.value)}
              />
            </label>
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Description</span>
              <Textarea
                required
                minLength={10}
                maxLength={5000}
                rows={6}
                value={draft.description}
                onChange={(e) => field("description", e.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Event date</span>
              <Input
                type="date"
                value={draft.event_date ?? ""}
                onChange={(e) => field("event_date", e.target.value || null)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Display order</span>
              <Input
                type="number"
                min={0}
                max={10000}
                value={draft.display_order}
                onChange={(e) => field("display_order", Number(e.target.value))}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Related event URL name</span>
              <Input
                placeholder="annual-picnic"
                value={draft.related_event_slug ?? ""}
                onChange={(e) => field("related_event_slug", e.target.value || null)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Related ministry URL name</span>
              <Input
                placeholder="youth-ministry"
                value={draft.related_ministry_slug ?? ""}
                onChange={(e) => field("related_ministry_slug", e.target.value || null)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Status</span>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={draft.status}
                onChange={(e) => field("status", e.target.value as GalleryAlbumInput["status"])}
                disabled={!canPublish(role)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Publication time (Houston)</span>
              <Input
                type="datetime-local"
                value={isoToHoustonInput(draft.published_at)}
                onChange={(e) =>
                  field("published_at", e.target.value ? houstonInputToIso(e.target.value) : null)
                }
              />
            </label>
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Search title (optional)</span>
              <Input
                maxLength={70}
                value={draft.seo_title ?? ""}
                onChange={(e) => field("seo_title", e.target.value || null)}
              />
            </label>
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Search description (optional)</span>
              <Textarea
                maxLength={170}
                value={draft.seo_description ?? ""}
                onChange={(e) => field("seo_description", e.target.value || null)}
              />
            </label>
          </div>
          <Button className="mt-6" disabled={busy}>
            {busy ? "Saving…" : "Save album"}
          </Button>
        </form>

        {selected && (
          <section
            className="mt-8 rounded-2xl border bg-card p-6 md:p-8"
            aria-labelledby="album-photos-heading"
          >
            <h3 id="album-photos-heading" className="font-display text-2xl">
              Photos
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload several JPG, PNG or WebP files. Each becomes a lightweight thumbnail and an
              optimized full image before upload. Maximum {data.limits.photosPerAlbum} photos per
              album.
            </p>
            <form onSubmit={uploadPhotos} className="mt-5 flex flex-wrap items-end gap-3">
              <label className="grid flex-1 gap-2">
                <span className="text-sm font-medium">Choose photos</span>
                <Input
                  name="photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  required
                />
              </label>
              <Button
                type="submit"
                variant="outline"
                disabled={busy || selected.photo_count >= data.limits.photosPerAlbum}
              >
                <ImagePlus className="size-4" /> Upload
              </Button>
            </form>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {selected.photos.map((photo) => (
                <PhotoEditor
                  key={photo.id}
                  photo={photo}
                  busy={busy}
                  onSave={updatePhoto}
                  onRemove={removePhoto}
                />
              ))}
            </div>
            {!selected.photos.length && (
              <p className="mt-8 text-sm text-muted-foreground">
                Add the first photo before publishing this album.
              </p>
            )}
          </section>
        )}
      </div>
    </section>
  );
}

function PhotoEditor({
  photo,
  busy,
  onSave,
  onRemove,
}: {
  photo: AdminGalleryPhoto;
  busy: boolean;
  onSave: (photo: AdminGalleryPhoto, changes: Partial<AdminGalleryPhoto>) => Promise<void>;
  onRemove: (photo: AdminGalleryPhoto) => Promise<void>;
}) {
  const [alt, setAlt] = useState(photo.image_alt);
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [order, setOrder] = useState(photo.display_order);
  const [featured, setFeatured] = useState(Boolean(photo.featured));
  return (
    <article className="overflow-hidden rounded-xl border">
      <img
        src={photo.thumbnail_path || photo.image_path}
        alt={photo.image_alt}
        width={photo.image_width ?? undefined}
        height={photo.image_height ?? undefined}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="grid gap-4 p-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Accessible description</span>
          <Textarea
            required
            minLength={3}
            maxLength={240}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Caption (optional)</span>
          <Textarea maxLength={500} value={caption} onChange={(e) => setCaption(e.target.value)} />
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Order</span>
            <Input
              className="w-24"
              type="number"
              min={0}
              max={10000}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />{" "}
            Album cover
          </label>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() =>
              void onSave(photo, {
                image_alt: alt,
                caption: caption || null,
                display_order: order,
                featured: featured ? 1 : 0,
              })
            }
          >
            Save photo
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void onRemove(photo)}
          >
            <Trash2 className="size-4" /> Remove
          </Button>
        </div>
      </div>
    </article>
  );
}
