import type { WorkspaceType } from "@/lib/constants";

export type WorkspaceRole = "owner" | "admin" | "member";
export type VtuOperator = "spurs" | "third_party";
export type InviteRole = Exclude<WorkspaceRole, "owner">;

export type Workspace = {
  id: string;
  name: string;
  type: WorkspaceType;
  operatorType: VtuOperator | null;
  slug: string | null;
  payIdentityId: string | null;
  createdAt: string;
};

export type WorkspaceCustomer = {
  userId: string;
  name: string | null;
  email: string | null;
  status: "active" | "suspended";
  createdAt: string;
  lastSeenAt: string;
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
