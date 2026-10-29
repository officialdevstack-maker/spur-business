import type { WorkspaceType } from "@/lib/constants";

export type WorkspaceRole = "owner" | "admin" | "member";
export type InviteRole = Exclude<WorkspaceRole, "owner">;

export type Workspace = {
  id: string;
  name: string;
  type: WorkspaceType;
  slug: string | null;
  payIdentityId: string | null;
  createdAt: string;
};

export type WorkspaceMember = {
  userId: string;
  name: string | null;
  email: string | null;
  role: WorkspaceRole;
  joinedAt: string;
};

export type WorkspaceInvite = {
  id: string;
  email: string | null;
  inviteeUserId: string | null;
  role: InviteRole;
  invitedBy: string;
  createdAt: string;
};

export type UserInvite = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceType: WorkspaceType;
  role: InviteRole;
  createdAt: string;
};
