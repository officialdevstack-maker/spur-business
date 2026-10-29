import { changeMemberRole, fail, removeMember } from "@/lib/workspaces/team";
import { teamRoute } from "@/lib/workspaces/team-http";
import { validateRoleChange } from "@/lib/workspaces/team-validators";

type Context = { params: Promise<{ workspaceId: string; userId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { workspaceId, userId } = await params;
  const body: unknown = await request.json().catch(() => undefined);

  return teamRoute(async (user) => {
    const role = validateRoleChange(body);
    if (!role) return fail("INVALID_INPUT");
    return changeMemberRole(workspaceId, user.sub, userId, role);
  });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { workspaceId, userId } = await params;
  return teamRoute((user) => removeMember(workspaceId, user.sub, userId));
}
