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
