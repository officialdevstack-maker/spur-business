import { createInvite, fail } from "@/lib/workspaces/team";
import { teamRoute } from "@/lib/workspaces/team-http";
import { validateInvite } from "@/lib/workspaces/team-validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;
  const body: unknown = await request.json().catch(() => undefined);

  return teamRoute(async (user) => {
    const input = validateInvite(body);
    if (!input) return fail("INVALID_INPUT");
    return createInvite(workspaceId, user.sub, input);
  }, 201);
}
