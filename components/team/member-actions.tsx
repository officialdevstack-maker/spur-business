"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InviteRole, WorkspaceRole } from "@/lib/db/schema";
import {
  canChangeRoles,
  canRemoveMember,
  canTransferOwnership,
} from "@/lib/workspaces/permissions";
import { teamRequest } from "./api";

export function MemberActions({
  workspaceId,
  memberId,
  memberName,
  memberRole,
  viewerRole,
  isSelf,
}: {
  workspaceId: string;
  memberId: string;
  memberName: string;
  memberRole: WorkspaceRole;
  viewerRole: WorkspaceRole;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = `/api/workspaces/${encodeURIComponent(workspaceId)}`;
  const memberUrl = `${base}/members/${encodeURIComponent(memberId)}`;

  const canRole = !isSelf && memberRole !== "owner" && canChangeRoles(viewerRole);
  const canTransfer = !isSelf && memberRole !== "owner" && canTransferOwnership(viewerRole);
  const canRemove = isSelf ? memberRole !== "owner" : canRemoveMember(viewerRole, memberRole);

  if (!canRole && !canTransfer && !canRemove) return null;

  async function run(
    url: string,
    method: "POST" | "PATCH" | "DELETE",
    body: unknown,
    onDone: () => void,
  ) {
    setPending(true);
    setError(null);
    const result = await teamRequest(url, method, body);
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    onDone();
  }

  const buttonCls =
    "rounded-lg border border-[#12343B]/15 px-3 py-1.5 text-xs font-semibold hover:bg-[#12343B]/5 disabled:opacity-50";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {canRole && (
          <select
            aria-label={`Role for ${memberName}`}
            value={memberRole}
            disabled={pending}
            onChange={(event) =>
              void run(memberUrl, "PATCH", { role: event.target.value as InviteRole }, () =>
                router.refresh(),
              )
            }
            className="rounded-lg border border-[#12343B]/15 bg-white px-2 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
        )}

        {canTransfer && (
          <button
            type="button"
            disabled={pending}
            className={buttonCls}
            onClick={() => {
              if (!window.confirm(`Make ${memberName} the owner? You will become an admin.`)) {
                return;
              }
              void run(`${base}/transfer`, "POST", { userId: memberId }, () => router.refresh());
            }}
          >
            Make owner
          </button>
        )}

        {canRemove && (
          <button
            type="button"
            disabled={pending}
            className={`${buttonCls} text-red-600`}
            onClick={() => {
              const message = isSelf
                ? "Leave this workspace? You'll lose access until someone invites you again."
                : `Remove ${memberName} from this workspace?`;
              if (!window.confirm(message)) return;
              void run(memberUrl, "DELETE", undefined, () => {
                if (isSelf) router.push("/workspaces");
                router.refresh();
              });
            }}
          >
            {isSelf ? "Leave" : "Remove"}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
