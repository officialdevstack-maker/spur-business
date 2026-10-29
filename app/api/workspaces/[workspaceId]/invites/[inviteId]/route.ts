import { revokeInvite } from "@/lib/workspaces/team";
import { teamRoute } from "@/lib/workspaces/team-http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; inviteId: string }> },
) {
  const { workspaceId, inviteId } = await params;
  return teamRoute((user) => revokeInvite(workspaceId, user.sub, inviteId));
}
