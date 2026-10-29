import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { requireWorkspace, schoolSiteUrl } from "@/lib/workspaces/service";

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const { workspace } = await requireWorkspace(workspaceId, user.sub);
  if (workspace.type !== "school") notFound();

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">School</h1>

      <div className="rounded-2xl border border-[#12343B]/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-[#6A7E82]">Your school management site</p>
        <p className="mt-1 break-all text-lg font-semibold">
          {schoolSiteUrl(workspace.slug)}
        </p>
        <p className="mt-3 text-sm text-[#4C6267]">
          This site isn't live yet. We'll enable it once the schools app is ready.
        </p>
      </div>
    </section>
  );
}
