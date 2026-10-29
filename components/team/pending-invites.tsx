"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InviteRole, WorkspaceRole } from "@/lib/db/schema";
import { canInviteRole } from "@/lib/workspaces/permissions";
import { teamRequest } from "./api";

export type PendingInviteRow = {
  id: string;
  label: string;
  role: InviteRole;
  invitedOn: string;
};

export function PendingInvites({
  workspaceId,
  invites,
  viewerRole,
}: {
  workspaceId: string;
  invites: PendingInviteRow[];
  viewerRole: WorkspaceRole;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function revoke(inviteId: string) {
    setBusyId(inviteId);
    setError(null);
    const result = await teamRequest(
      `/api/workspaces/${encodeURIComponent(workspaceId)}/invites/${encodeURIComponent(inviteId)}`,
      "DELETE",
    );
    setBusyId(null);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  if (invites.length === 0) {
    return <p className="text-sm text-[#6A7E82]">No pending invitations.</p>;
  }

  return (
    <div>
      <ul className="divide-y divide-[#12343B]/10">
        {invites.map((invite) => {
          const canRevoke = canInviteRole(viewerRole, invite.role);
          return (
            <li
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{invite.label}</p>
                <p className="mt-0.5 text-xs text-[#6A7E82]">
                  <span className="capitalize">{invite.role}</span> · Invited {invite.invitedOn}
                </p>
              </div>
              {canRevoke && (
                <button
                  type="button"
                  disabled={busyId === invite.id}
                  onClick={() => void revoke(invite.id)}
                  className="rounded-lg border border-[#12343B]/15 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50"
                >
                  {busyId === invite.id ? "Revoking…" : "Revoke"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
