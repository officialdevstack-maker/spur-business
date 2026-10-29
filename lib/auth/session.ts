import "server-only";

import { getSpursUser, requireSpursUser } from "@spurs-cloud/accounts/next";

export type SessionUser = Awaited<ReturnType<typeof getSpursUser>> extends infer User
  ? Exclude<User, null>
  : never;

export async function getSessionUser(): Promise<SessionUser | null> {
  return getSpursUser();
}

export async function requireUser(): Promise<SessionUser> {
  return requireSpursUser();
}

export function sessionProfile(user: SessionUser): {
  name: string | null;
  email: string | null;
} {
  const name = typeof user.name === "string" ? user.name.trim().slice(0, 120) : "";
  const email =
    user.email_verified === true && typeof user.email === "string"
      ? user.email.trim().toLowerCase()
      : "";

  return {
    name: name || null,
    email: email.includes("@") && email.length <= 254 ? email : null,
  };
}
