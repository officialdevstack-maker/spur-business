import { Icon } from "@/components/layout/icons";
import { requireUser } from "@/lib/auth/session";
import type { WorkspaceRole } from "@/lib/db/schema";
import { listWorkspaceMembers, requireWorkspace } from "@/lib/workspaces/service";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Africa/Lagos",
});

const ROLE_INFO: { role: WorkspaceRole; description: string }[] = [
  { role: "owner", description: "Full control of the workspace, including its team." },
  { role: "admin", description: "Manages members and day-to-day settings." },
  { role: "member", description: "Works in the workspace without managing it." },
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
  const { workspace } = await requireWorkspace(workspaceId, user.sub);
  const members = await listWorkspaceMembers(workspace.id);

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-[#6A7E82]">
            {members.length} {members.length === 1 ? "member" : "members"} in {workspace.name}
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Invites are coming soon"
          className="flex h-11 cursor-not-allowed items-center gap-2 rounded-xl bg-[#F2B632] px-5 text-sm font-semibold text-[#12343B] opacity-50"
        >
          <Icon name="plus" className="size-4" />
          Invite member
          <span className="rounded-full bg-[#12343B]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Soon
          </span>
        </button>
      </div>

      <ul className="divide-y divide-[#12343B]/10 rounded-2xl border border-[#12343B]/10 bg-white shadow-sm">
        {members.map((member) => {
          const isYou = member.userId === user.sub;
          const displayName = isYou ? (user.name?.trim() || "You") : "Spurs member";

          return (
            <li key={member.userId} className="flex items-center gap-4 px-5 py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F2B632]/20 font-semibold text-[#12343B]">
                {isYou ? (
                  displayName.charAt(0).toUpperCase()
                ) : (
                  <Icon name="users" className="size-5" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-semibold">
                  {displayName}
                  {isYou && (
                    <span className="rounded-full bg-[#12343B]/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      You
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#6A7E82]">
                  ID {shortId(member.userId)} · Joined{" "}
                  {dateFormatter.format(new Date(member.joinedAt))}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  member.role === "owner" ? "bg-[#F2B632]/20" : "bg-[#12343B]/5"
                }`}
              >
                {member.role}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="rounded-2xl border border-[#12343B]/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Roles</h2>
        <p className="mt-1 text-sm text-[#4C6267]">
          Role permissions will be enforced when team management launches.
        </p>
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
