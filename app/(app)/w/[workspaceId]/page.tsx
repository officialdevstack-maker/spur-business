import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getUserWorkspace } from "@/lib/workspaces/service";

export default async function WorkspacePage({
  params,
}: PageProps<"/w/[workspaceId]">) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()]);
  const result = await getUserWorkspace(user.sub, workspaceId);
  if (!result) notFound();

  const { workspace, role } = result;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
      <Link
        href="/workspaces"
        className="text-sm font-medium text-[#4C6267] underline underline-offset-4"
      >
        All workspaces
      </Link>
      <div className="mt-6 rounded-2xl border border-[#12343B]/10 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#6A7E82]">
          {workspace.type === "vtu" ? "VTU business" : "School"} · {role}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{workspace.name}</h1>
        <p className="mt-4 text-[#4C6267]">
          Pay account: {workspace.payIdentityId ? "Active" : "Pending"}
        </p>
      </div>
    </main>
  );
}
