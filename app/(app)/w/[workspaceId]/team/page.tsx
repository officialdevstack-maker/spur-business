import { InviteForm } from "@/components/team/invite-form";
import { MemberActions } from "@/components/team/member-actions";
import { PendingInvites } from "@/components/team/pending-invites";
import { Icon } from "@/components/layout/icons";
import { requireUser, sessionProfile } from "@/lib/auth/session";
import type { WorkspaceInvite, WorkspaceRole } from "@/lib/db/schema";
import { canManageTeam } from "@/lib/workspaces/permissions";
import { listWorkspaceMembers, requireWorkspace } from "@/lib/workspaces/service";
import { listPendingInvites } from "@/lib/workspaces/team";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Africa/Lagos",
});

const ROLE_INFO: { role: WorkspaceRole; description: string }[] = [
  {
    role: "owner",
    description: "Full control. Can invite admins, change roles, remove anyone and transfer ownership.",
  },
  {
    role: "admin",
    description: "Can invite and remove members, and revoke member invites.",
  },
  { role: "member", description: "Works in the workspace without managing the team." },
];

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const { workspace, role } = await requireWorkspace(workspaceId, user.sub);
  const profile = sessionProfile(user);
  const canManage = canManageTeam(role);
  const [members, invites] = await Promise.all([
    listWorkspaceMembers(workspace.id),
    canManage ? listPendingInvites(workspace.id) : Promise.resolve<WorkspaceInvite[]>([]),
  ]);
  const inviteRows = invites.map((invite) => ({
    id: invite.id,
    label: invite.email ?? `Spurs ID ${invite.inviteeUserId ?? ""}`,
    role: invite.role,
    invitedOn: dateFormatter.format(new Date(invite.createdAt)),
  }));

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-[#6A7E82]">
          {members.length} {members.length === 1 ? "member" : "members"} in {workspace.name}
        </p>
      </div>

      {canManage && (
        <div className="rounded-2xl border border-[#12343B]/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Invite someone</h2>
          <p className="mt-1 mb-4 text-sm text-[#4C6267]">
            Use their verified Spurs email or Spurs ID. They&apos;ll see the invite after signing in.
          </p>
          <InviteForm workspaceId={workspace.id} canInviteAdmins={role === "owner"} />
        </div>
      )}

      <ul className="divide-y divide-[#12343B]/10 rounded-2xl border border-[#12343B]/10 bg-white shadow-sm">
        {members.map((member) => {
          const isSelf = member.userId === user.sub;
          const displayName =
            (isSelf ? profile.name : null) ?? member.name ?? member.email ?? "Spurs member";
          const detail = [
            member.name && member.email ? member.email : null,
            `ID ${shortId(member.userId)}`,
            `Joined ${dateFormatter.format(new Date(member.joinedAt))}`,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <li key={member.userId} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F2B632]/20 font-semibold text-[#12343B]">
                {displayName === "Spurs member" ? (
                  <Icon name="users" className="size-5" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </span>

              <div className="min-w-0 flex-1 basis-48">
                <p className="flex items-center gap-2 truncate text-sm font-semibold">
                  {displayName}
                  {isSelf && (
                    <span className="rounded-full bg-[#12343B]/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      You
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#6A7E82]">{detail}</p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  member.role === "owner" ? "bg-[#F2B632]/20" : "bg-[#12343B]/5"
                }`}
              >
                {member.role}
              </span>

              <MemberActions
                workspaceId={workspace.id}
                memberId={member.userId}
                memberName={displayName}
                memberRole={member.role}
                viewerRole={role}
                isSelf={isSelf}
              />
            </li>
          );
        })}
      </ul>

      {canManage && (
        <div className="rounded-2xl border border-[#12343B]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Pending invites</h2>
          <PendingInvites workspaceId={workspace.id} invites={inviteRows} viewerRole={role} />
        </div>
      )}

      <div className="rounded-2xl border border-[#12343B]/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Roles</h2>
        <dl className="mt-4 space-y-3">
          {ROLE_INFO.map(({ role, description }) => (
            <div key={role} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <dt className="w-20 shrink-0 text-sm font-semibold capitalize">{role}</dt>
              <dd className="text-sm text-[#4C6267]">{description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
