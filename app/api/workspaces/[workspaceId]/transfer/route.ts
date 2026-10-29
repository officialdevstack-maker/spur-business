import { fail, transferOwnership } from "@/lib/workspaces/team";
import { teamRoute } from "@/lib/workspaces/team-http";
import { validateTransfer } from "@/lib/workspaces/team-validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;
  const body: unknown = await request.json().catch(() => undefined);

  return teamRoute(async (user) => {
    const targetId = validateTransfer(body);
    if (!targetId) return fail("INVALID_INPUT");
    return transferOwnership(workspaceId, user.sub, targetId);
  });
}
