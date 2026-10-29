import { requireUser } from "@/lib/auth/session";
import { requireWorkspace, schoolSiteUrl } from "@/lib/workspaces/service";

export default async function WorkspaceOverviewPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const { workspace, role } = await requireWorkspace(workspaceId, user.sub);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{workspace.name}</h1>
        <p className="mt-1 text-sm capitalize text-[#6A7E82]">
          {workspace.type === "vtu" ? "VTU business" : "School"} · You are {role}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#12343B]/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-[#6A7E82]">Pay account</p>
          <p className="mt-1 text-xl font-semibold">
            {workspace.payIdentityId ? "Active" : "Pending"}
          </p>
          {!workspace.payIdentityId && (
            <p className="mt-2 text-sm text-[#4C6267]">
              Spurs will set this up for your business. You&apos;ll see it here when it&apos;s ready.
            </p>
          )}
        </div>

        {workspace.type === "school" && (
          <div className="rounded-2xl border border-[#12343B]/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#6A7E82]">School site</p>
            <p className="mt-1 break-all text-sm font-semibold">
              {schoolSiteUrl(workspace.slug)}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
