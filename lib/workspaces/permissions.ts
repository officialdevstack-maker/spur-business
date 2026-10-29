import type { InviteRole, WorkspaceRole } from "@/lib/db/schema";

export function canManageTeam(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}

export function canInviteRole(actor: WorkspaceRole, invited: InviteRole): boolean {
  if (actor === "owner") return true;
  return actor === "admin" && invited === "member";
}

export function canRemoveMember(actor: WorkspaceRole, target: WorkspaceRole): boolean {
  if (actor === "owner") return target !== "owner";
  return actor === "admin" && target === "member";
}

export function canChangeRoles(actor: WorkspaceRole): boolean {
  return actor === "owner";
}

export function canTransferOwnership(actor: WorkspaceRole): boolean {
  return actor === "owner";
}
