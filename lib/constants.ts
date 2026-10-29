export const MAX_OWNED_WORKSPACES = 5;
export const MAX_PENDING_INVITES = 50;

export const WORKSPACE_TYPES = ["vtu", "school"] as const;

export type WorkspaceType = (typeof WORKSPACE_TYPES)[number];
