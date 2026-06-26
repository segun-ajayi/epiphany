import { useSession } from "@tanstack/react-start/server";
import { getEnv } from "@/lib/env.server.ts";

export type AdminSession = {
  isAdmin?: boolean;
  loggedInAt?: number;
};

const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;

export function getAdminSessionConfig() {
  const secret = getEnv("SESSION_SECRET");

  const password =
    secret && secret.length >= 32
      ? secret
      : "dev-only-insecure-session-secret-please-rotate".padEnd(32, "x");

  return {
    password,
    name: "epiphany_admin",
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      httpOnly: true,
      secure: getEnv("NODE_ENV") === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function getAdminSession() {
  return useSession<AdminSession>(getAdminSessionConfig());
}

export async function isAdminAuthed(): Promise<boolean> {
  const session = await getAdminSession();

  if (session.data.isAdmin !== true) {
    return false;
  }

  const loginTime = session.data.loggedInAt;

  if (!loginTime) {
    await session.clear();
    return false;
  }

  if (Date.now() - loginTime > SESSION_TIMEOUT_MS) {
    await session.clear();
    return false;
  }

  return true;
}
