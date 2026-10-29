import { sessionProfile } from "@/lib/auth/session";
import { fail, respondToInvite } from "@/lib/workspaces/team";
import { teamRoute } from "@/lib/workspaces/team-http";
import { validateInviteResponse } from "@/lib/workspaces/team-validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  const { inviteId } = await params;
  const body: unknown = await request.json().catch(() => undefined);

  return teamRoute(async (user) => {
    const action = validateInviteResponse(body);
    if (!action) return fail("INVALID_INPUT");
    const profile = sessionProfile(user);
    return respondToInvite(
      inviteId,
      { id: user.sub, name: profile.name, email: profile.email },
      action,
    );
  });
}
