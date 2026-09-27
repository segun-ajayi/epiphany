import { useEffect, useState, type FormEvent } from "react";
import { ShieldCheck, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminRole } from "@/lib/auth/permissions";
import type { TeamMember } from "@/lib/team/schemas";

type TeamData = { members: TeamMember[]; currentUserId: string };

const roleDescription: Record<AdminRole, string> = {
  editor: "Can create and edit drafts.",
  publisher: "Can also publish and archive website content.",
  administrator: "Full access, including team and newsletter settings.",
};

export function TeamManager() {
  const [data, setData] = useState<TeamData | null>(null);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/team", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Unable to load the church team.");
    setData(body);
  }

  useEffect(() => {
    void load().catch((error) => setMessage(error.message));
  }, []);

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusyId("create");
    setMessage("");
    try {
      const response = await fetch("/api/admin/team", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({
          action: "create",
          email: values.get("email"),
          role: values.get("role"),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to add this team member.");
      form.reset();
      await load();
      setMessage("Team member approved. They can now sign in with that Google account.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add this team member.");
    } finally {
      setBusyId("");
    }
  }

  async function saveMember(member: TeamMember, role: AdminRole, active: boolean) {
    setBusyId(member.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/team", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({
          action: "update",
          id: member.id,
          role,
          active,
          updatedAt: member.updatedAt,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to update this team member.");
      await load();
      setMessage(`${member.email} was updated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update this team member.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section aria-labelledby="team-heading">
      <div>
        <p className="flex items-center gap-2 text-sm text-burgundy">
          <Users className="size-4" aria-hidden /> Access control
        </p>
        <h2 id="team-heading" className="mt-2 font-display text-3xl">
          Church team
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Approve a Google account before that person signs in. Passwords and Google credentials are
          never stored here.
        </p>
      </div>

      <form onSubmit={addMember} className="mt-7 rounded-2xl border bg-card p-5 md:p-6">
        <p className="flex items-center gap-2 font-medium">
          <UserPlus className="size-4 text-burgundy" aria-hidden /> Add a team member
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium">
            Google account email
            <Input
              name="email"
              type="email"
              required
              maxLength={254}
              placeholder="name@example.com"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Role
            <select
              name="role"
              defaultValue="editor"
              className="h-10 rounded-md border bg-background px-3"
            >
              <option value="editor">Editor</option>
              <option value="publisher">Publisher</option>
              <option value="administrator">Administrator</option>
            </select>
          </label>
          <Button type="submit" disabled={busyId === "create"}>
            {busyId === "create" ? "Adding…" : "Approve account"}
          </Button>
        </div>
        <div className="mt-4 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
          {(Object.entries(roleDescription) as [AdminRole, string][]).map(([role, description]) => (
            <p key={role}>
              <strong className="capitalize text-foreground">{role}:</strong> {description}
            </p>
          ))}
        </div>
      </form>

      {message && (
        <p role="status" className="mt-5 rounded-xl bg-secondary p-4 text-sm">
          {message}
        </p>
      )}

      <div className="mt-7 overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Approved church team accounts</caption>
          <thead className="bg-secondary">
            <tr>
              <th className="p-4">Account</th>
              <th className="p-4">Role</th>
              <th className="p-4">Access</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {data?.members.map((member) => (
              <TeamRow
                key={member.id}
                member={member}
                isCurrent={member.id === data.currentUserId}
                busy={busyId === member.id}
                onSave={saveMember}
              />
            ))}
          </tbody>
        </table>
        {!data && !message && <p className="p-10 text-center text-muted-foreground">Loading…</p>}
      </div>
    </section>
  );
}

function TeamRow({
  member,
  isCurrent,
  busy,
  onSave,
}: {
  member: TeamMember;
  isCurrent: boolean;
  busy: boolean;
  onSave: (member: TeamMember, role: AdminRole, active: boolean) => Promise<void>;
}) {
  const [role, setRole] = useState<AdminRole>(member.role);
  const [active, setActive] = useState(member.active);
  const unchanged = role === member.role && active === member.active;
  return (
    <tr className="border-t">
      <td className="p-4">
        <p className="font-medium">{member.email}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {isCurrent && <Badge variant="secondary">You</Badge>}
          <Badge variant={member.linked ? "secondary" : "outline"}>
            {member.linked ? "Google linked" : "Awaiting first sign-in"}
          </Badge>
        </div>
      </td>
      <td className="p-4">
        <select
          aria-label={`Role for ${member.email}`}
          value={role}
          disabled={busy || isCurrent}
          onChange={(event) => setRole(event.target.value as AdminRole)}
          className="h-9 rounded-md border bg-background px-3"
        >
          <option value="editor">Editor</option>
          <option value="publisher">Publisher</option>
          <option value="administrator">Administrator</option>
        </select>
      </td>
      <td className="p-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={active}
            disabled={busy || isCurrent}
            onChange={(event) => setActive(event.target.checked)}
          />
          {active ? "Active" : "Disabled"}
        </label>
      </td>
      <td className="p-4">
        <Button
          size="sm"
          variant="outline"
          disabled={busy || unchanged || isCurrent}
          onClick={() => void onSave(member, role, active)}
        >
          <ShieldCheck className="size-4" aria-hidden /> Save
        </Button>
      </td>
    </tr>
  );
}
