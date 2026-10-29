"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { teamRequest } from "./api";

function readWorkspaceId(data: unknown): string | null {
  return typeof data === "object" &&
    data !== null &&
    "workspaceId" in data &&
    typeof data.workspaceId === "string"
    ? data.workspaceId
    : null;
}

export function InviteResponse({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "accept" | "decline") {
    setPending(true);
    setError(null);
    const result = await teamRequest(`/api/invites/${encodeURIComponent(inviteId)}`, "POST", {
      action,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      router.refresh();
      return;
    }

    const workspaceId = readWorkspaceId(result.data);
    if (action === "accept" && workspaceId) {
      router.push(`/w/${encodeURIComponent(workspaceId)}`);
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void respond("accept")}
          className="h-10 rounded-xl bg-[#F2B632] px-5 text-sm font-semibold text-[#12343B] disabled:opacity-60"
        >
          Accept
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void respond("decline")}
          className="h-10 rounded-xl border border-[#12343B]/15 px-5 text-sm font-semibold hover:bg-[#12343B]/5 disabled:opacity-60"
        >
          Decline
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
