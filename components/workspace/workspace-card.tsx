import Link from "next/link";
import type { Workspace, WorkspaceRole } from "@/lib/db/schema";

export function WorkspaceCard({
  workspace,
  role,
}: {
  workspace: Workspace;
  role: WorkspaceRole;
}) {
  return (
    <Link
      href={`/w/${encodeURIComponent(workspace.id)}`}
      className="block rounded-2xl border border-[#12343B]/10 bg-white p-5 shadow-sm transition hover:border-[#F2B632]"
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-[#12343B]/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          {workspace.type === "vtu" ? "VTU" : "School"}
        </span>
        <span className="text-xs capitalize text-[#6A7E82]">{role}</span>
      </div>
      <p className="mt-4 text-lg font-semibold">{workspace.name}</p>
      <p className="mt-1 text-sm text-[#6A7E82]">
        Pay account: {workspace.payIdentityId ? "Active" : "Pending"}
      </p>
    </Link>
  );
}
