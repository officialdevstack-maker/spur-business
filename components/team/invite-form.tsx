"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { InviteRole } from "@/lib/db/schema";
import { teamRequest } from "./api";

export function InviteForm({
  workspaceId,
  canInviteAdmins,
}: {
  workspaceId: string;
  canInviteAdmins: boolean;
}) {
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [role, setRole] = useState<InviteRole>("member");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    const result = await teamRequest(
      `/api/workspaces/${encodeURIComponent(workspaceId)}/invites`,
      "POST",
      { target, role },
    );
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setTarget("");
    setNotice("Invite created. They'll see it when they sign in to Spurs Business.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <label htmlFor="invite-target" className="sr-only">
            Email or Spurs ID
          </label>
          <input
            id="invite-target"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            required
            maxLength={254}
            placeholder="Email or Spurs ID"
            className="h-11 w-full rounded-xl border border-[#12343B]/15 bg-white px-4 text-sm outline-none focus:border-[#F2B632]"
          />
        </div>
        <div>
          <label htmlFor="invite-role" className="sr-only">
            Role
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(event) => setRole(event.target.value as InviteRole)}
            className="h-11 rounded-xl border border-[#12343B]/15 bg-white px-3 text-sm outline-none focus:border-[#F2B632]"
          >
            <option value="member">Member</option>
            {canInviteAdmins && <option value="admin">Admin</option>}
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-xl bg-[#F2B632] px-5 text-sm font-semibold text-[#12343B] disabled:opacity-60"
        >
          {pending ? "Inviting…" : "Send invite"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {notice && <p className="text-sm text-[#4C6267]">{notice}</p>}
    </form>
  );
}
