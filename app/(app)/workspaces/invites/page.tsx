import Link from "next/link";
import { InviteResponse } from "@/components/team/invite-response";
import { requireUser, sessionProfile } from "@/lib/auth/session";
import { listInvitesForUser } from "@/lib/workspaces/team";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Africa/Lagos",
});

export default async function InvitesPage() {
  const user = await requireUser();
  const invites = await listInvitesForUser(user.sub, sessionProfile(user).email);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 sm:px-10">
      <h1 className="text-3xl font-bold tracking-tight">Invitations</h1>
      <p className="mt-1 text-sm text-[#6A7E82]">Workspaces you&apos;ve been invited to join.</p>

      {invites.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#12343B]/20 p-10 text-center text-[#4C6267]">
          <p>No pending invitations.</p>
          <Link
            href="/workspaces"
            className="mt-3 inline-block text-sm font-semibold underline underline-offset-4"
          >
            Go to your workspaces
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {invites.map((invite) => (
            <li
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#12343B]/10 bg-white p-5 shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{invite.workspaceName}</p>
                <p className="mt-1 text-sm text-[#6A7E82]">
                  {invite.workspaceType === "vtu" ? "VTU business" : "School"} · Join as{" "}
                  <span className="capitalize">{invite.role}</span> · Invited{" "}
                  {dateFormatter.format(new Date(invite.createdAt))}
                </p>
              </div>
              <InviteResponse inviteId={invite.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
