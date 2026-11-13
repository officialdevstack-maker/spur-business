"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { canManageTeam } from "@/lib/workspaces/permissions";
import { requireWorkspace } from "@/lib/workspaces/service";
import {
  disconnectVtuSite,
  startVtuConnection,
  verifyVtuConnection,
} from "@/lib/vtu/connection";

export type ConnectActionResult = { ok: true; secret?: string } | { ok: false; error: string };

const DENIED: ConnectActionResult = {
  ok: false,
  error: "Only owners and admins of a third-party VTU workspace can connect a site.",
};

async function authorize(workspaceId: string): Promise<boolean> {
  const user = await requireUser();
  const { workspace, role } = await requireWorkspace(workspaceId, user.sub);
  return workspace.type === "vtu" && workspace.operatorType === "third_party" && canManageTeam(role);
}

const refresh = (workspaceId: string) => revalidatePath(`/w/${workspaceId}/vtu/connect`);

export async function startConnectionAction(
  workspaceId: string,
  siteUrl: string,
): Promise<ConnectActionResult> {
  if (!(await authorize(workspaceId))) return DENIED;
  const result = await startVtuConnection(workspaceId, siteUrl);
  if (!result.ok) return result;
  refresh(workspaceId);
  return { ok: true };
}

export async function verifyConnectionAction(workspaceId: string): Promise<ConnectActionResult> {
  if (!(await authorize(workspaceId))) return DENIED;
  const result = await verifyVtuConnection(workspaceId);
  if (!result.ok) return result;
  refresh(workspaceId);
  revalidatePath(`/w/${workspaceId}/vtu`);
  return { ok: true, secret: result.data.secret };
}

export async function disconnectSiteAction(workspaceId: string): Promise<ConnectActionResult> {
  if (!(await authorize(workspaceId))) return DENIED;
  await disconnectVtuSite(workspaceId);
  refresh(workspaceId);
  return { ok: true };
}
