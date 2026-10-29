import { z } from "zod";
import type { InviteRole } from "@/lib/db/schema";

export type InviteInput = {
  kind: "email" | "user";
  value: string;
  role: InviteRole;
};

const roleSchema = z.enum(["admin", "member"]);
const inviteBody = z.object({ target: z.string().trim().min(1).max(254), role: roleSchema });
const emailSchema = z.email().max(254);

export function validateInvite(input: unknown): InviteInput | null {
  const parsed = inviteBody.safeParse(input);
  if (!parsed.success) return null;

  const { target, role } = parsed.data;
  if (target.includes("@")) {
    const email = emailSchema.safeParse(target.toLowerCase());
    return email.success ? { kind: "email", value: email.data, role } : null;
  }

  return /^[\w.-]{1,64}$/.test(target) ? { kind: "user", value: target, role } : null;
}

export function validateRoleChange(input: unknown): InviteRole | null {
  const parsed = z.object({ role: roleSchema }).safeParse(input);
  return parsed.success ? parsed.data.role : null;
}

export function validateTransfer(input: unknown): string | null {
  const parsed = z.object({ userId: z.string().min(1).max(64) }).safeParse(input);
  return parsed.success ? parsed.data.userId : null;
}

export function validateInviteResponse(input: unknown): "accept" | "decline" | null {
  const parsed = z.object({ action: z.enum(["accept", "decline"]) }).safeParse(input);
  return parsed.success ? parsed.data.action : null;
}
