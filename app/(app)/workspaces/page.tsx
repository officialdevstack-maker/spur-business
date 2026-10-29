import Link from "next/link";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { MAX_OWNED_WORKSPACES } from "@/lib/constants";
import { requireUser } from "@/lib/auth/session";
import { countOwnedWorkspaces, listUserWorkspaces } from "@/lib/workspaces/service";

export default async function WorkspacesPage() {
  const user = await requireUser();
  const [rows, owned] = await Promise.all([
    listUserWorkspaces(user.sub),
    countOwnedWorkspaces(user.sub),
  ]);
  const atLimit = owned >= MAX_OWNED_WORKSPACES;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your workspaces</h1>
          <p className="mt-1 text-sm text-[#6A7E82]">
            {owned} of {MAX_OWNED_WORKSPACES} owned workspaces used
          </p>
        </div>
        {atLimit ? (
          <p className="text-sm text-[#6A7E82]">Workspace limit reached.</p>
        ) : (
          <Link
            href="/workspaces/new"
            className="rounded-xl bg-[#F2B632] px-5 py-3 text-sm font-semibold"
          >
            New workspace
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-[#12343B]/20 p-10 text-center text-[#4C6267]">
          No workspaces yet. Create your first one to get started.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ workspace, role }) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} role={role} />
          ))}
        </div>
      )}
    </main>
  );
}
