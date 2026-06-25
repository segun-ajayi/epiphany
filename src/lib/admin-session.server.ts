import { useSession } from "@tanstack/react-start/server";

export type AdminSession = { isAdmin?: boolean; loggedInAt?: number };

export function getAdminSessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    // useSession requires >=32 chars; in dev fall back to a dev-only key.
    return {
      password: (password ?? "dev-only-insecure-session-secret-please-rotate").padEnd(32, "x"),
      name: "epiphany_admin",
      maxAge: 60 * 60 * 24 * 7,
      cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
    };
  }
  return {
    password,
    name: "epiphany_admin",
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

export async function getAdminSession() {
  return useSession<AdminSession>(getAdminSessionConfig());
}

export async function isAdminAuthed(): Promise<boolean> {
  const s = await getAdminSession();
  return s.data.isAdmin === true;
}
