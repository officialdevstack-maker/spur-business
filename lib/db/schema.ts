import type { WorkspaceType } from "@/lib/constants";

export type WorkspaceRole = "owner" | "admin" | "member";

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
  role: WorkspaceRole;
  joinedAt: string;
};
