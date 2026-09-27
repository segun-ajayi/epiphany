import { useEffect, useState, type FormEvent } from "react";
import { Plus, Upload, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { prepareImageUpload } from "@/lib/admin/image";
import { canPublish, type AdminRole } from "@/lib/auth/permissions";
import type { AdminLeader, LeaderInput } from "@/lib/leadership/schemas";

const emptyLeader: LeaderInput = {
  name: "",
  role: "",
  bio: "",
  email: null,
  phone: null,
  facebook_url: null,
  instagram_url: null,
  linkedin_url: null,
  photo_alt: null,
  remove_photo: false,
  display_order: 0,
  status: "draft",
};

function editable(item: AdminLeader): LeaderInput {
  return {
    name: item.name,
    role: item.role,
    bio: item.bio,
    email: item.email,
    phone: item.phone,
    facebook_url: item.facebook_url,
    instagram_url: item.instagram_url,
    linkedin_url: item.linkedin_url,
    photo_alt: item.photo_alt,
    remove_photo: false,
    display_order: item.display_order,
    status: item.status,
  };
}

export function LeadershipManager({ role }: { role: AdminRole }) {
  const [leaders, setLeaders] = useState<AdminLeader[]>([]);
  const [selected, setSelected] = useState<AdminLeader | null>(null);
  const [draft, setDraft] = useState<LeaderInput>(emptyLeader);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load(selectId?: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/leadership", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Leadership profiles could not be loaded.");
      const items = (body.leaders ?? []) as AdminLeader[];
      setLeaders(items);
      if (selectId) {
        const item = items.find((leader) => leader.id === selectId) ?? null;
        setSelected(item);
        setDraft(item ? editable(item) : emptyLeader);
      }
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : "Leadership profiles could not be loaded.",
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function choose(item: AdminLeader | null) {
    setSelected(item);
    setDraft(item ? editable(item) : { ...emptyLeader, display_order: leaders.length * 10 + 10 });
    setMessage("");
    setError("");
  }

  function field<K extends keyof LeaderInput>(key: K, value: LeaderInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const imageInput = event.currentTarget.elements.namedItem("photo");
      const source = imageInput instanceof HTMLInputElement ? imageInput.files?.[0] : undefined;
      const form = new FormData();
      form.set(
        "payload",
        JSON.stringify({
          action: "save-leader",
          id: selected?.id,
          revision: selected?.revision,
          leader: draft,
        }),
      );
      if (source) form.set("image", await prepareImageUpload(source));
      const response = await fetch("/api/admin/leadership", {
        method: selected ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "X-Admin-Request": "1" },
        body: form,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The profile could not be saved.");
      await load(body.id);
      setMessage("Leadership profile saved. Published profiles now appear on the About page.");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "The profile could not be saved.");
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="leadership-heading" className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <div>
        <p className="flex items-center gap-2 text-sm text-burgundy">
          <UsersRound className="size-4" /> Public clergy and staff
        </p>
        <h2 id="leadership-heading" className="mt-2 font-display text-3xl">
          Leadership
        </h2>
        <Button className="mt-5" variant="outline" onClick={() => choose(null)}>
          <Plus className="size-4" /> Add profile
        </Button>
        <div className="mt-5 space-y-2">
          {leaders.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => choose(item)}
              className={`w-full rounded-xl border p-4 text-left ${selected?.id === item.id ? "border-burgundy bg-secondary" : "bg-card"}`}
            >
              <span className="block font-medium">{item.name}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {item.role} · {item.status}
              </span>
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={save} className="rounded-2xl border bg-card p-6 md:p-8">
        <h3 className="font-display text-2xl">{selected ? "Edit profile" : "New profile"}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Leave contact and social fields blank unless they have been verified for public display.
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
        <fieldset disabled={busy} className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Name
            <Input
              required
              maxLength={160}
              value={draft.name}
              onChange={(e) => field("name", e.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Role or title
            <Input
              required
              maxLength={160}
              value={draft.role}
              onChange={(e) => field("role", e.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium md:col-span-2">
            Biography (optional)
            <Textarea
              rows={6}
              maxLength={3000}
              value={draft.bio}
              onChange={(e) => field("bio", e.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Public email (optional)
            <Input
              type="email"
              maxLength={254}
              value={draft.email ?? ""}
              onChange={(e) => field("email", e.target.value || null)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Public phone (optional)
            <Input
              type="tel"
              maxLength={40}
              value={draft.phone ?? ""}
              onChange={(e) => field("phone", e.target.value || null)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Facebook URL (optional)
            <Input
              type="url"
              value={draft.facebook_url ?? ""}
              onChange={(e) => field("facebook_url", e.target.value || null)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Instagram URL (optional)
            <Input
              type="url"
              value={draft.instagram_url ?? ""}
              onChange={(e) => field("instagram_url", e.target.value || null)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium md:col-span-2">
            LinkedIn URL (optional)
            <Input
              type="url"
              value={draft.linkedin_url ?? ""}
              onChange={(e) => field("linkedin_url", e.target.value || null)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium md:col-span-2">
            Profile photo
            <Input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
            <span className="text-xs font-normal text-muted-foreground">
              JPG, PNG or WebP; optimized in your browser before upload.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-medium md:col-span-2">
            Photo description
            <Input
              maxLength={240}
              value={draft.photo_alt ?? ""}
              onChange={(e) => field("photo_alt", e.target.value || null)}
            />
          </label>
          {selected?.photo_path && (
            <div className="md:col-span-2">
              <img
                src={selected.photo_path}
                alt={selected.photo_alt || selected.name}
                className="h-44 w-44 rounded-xl object-cover object-top"
              />
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.remove_photo}
                  onChange={(e) => field("remove_photo", e.target.checked)}
                />{" "}
                Remove current photo when saving
              </label>
            </div>
          )}
          <label className="grid gap-2 text-sm font-medium">
            Display order
            <Input
              type="number"
              min={0}
              max={10000}
              value={draft.display_order}
              onChange={(e) => field("display_order", Number(e.target.value))}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Publication status
            <select
              className="h-10 rounded-md border bg-background px-3"
              value={draft.status}
              onChange={(e) => field("status", e.target.value as LeaderInput["status"])}
            >
              <option value="draft">Draft</option>
              {canPublish(role) && <option value="published">Published</option>}
              <option value="archived">Archived</option>
            </select>
          </label>
        </fieldset>
        <Button className="mt-6" disabled={busy}>
          <Upload className="size-4" /> {busy ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </section>
  );
}
