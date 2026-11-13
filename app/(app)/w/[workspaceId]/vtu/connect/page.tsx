import { notFound } from "next/navigation";
import { ConnectSiteForm } from "@/components/vtu/connect-site-form";
import { requireUser } from "@/lib/auth/session";
import { getVtuConnection } from "@/lib/vtu/connection";
import { canManageTeam } from "@/lib/workspaces/permissions";
import { requireWorkspace } from "@/lib/workspaces/service";

export default async function ConnectSitePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const { workspace, role } = await requireWorkspace(workspaceId, user.sub);
  if (workspace.type !== "vtu") notFound();

  const canManage = canManageTeam(role);
  const savedConnection =
    workspace.operatorType === "third_party" && canManage
      ? await getVtuConnection(workspaceId)
      : null;
  const connection =
    savedConnection?.status === "verified"
      ? { ...savedConnection, verifyToken: "" }
      : savedConnection;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connect your site</h1>
        <p className="mt-1 text-sm text-[#6A7E82]">
          Link your VTU site so its products, customers and transactions show up in this workspace.
        </p>
      </div>

      {workspace.operatorType !== "third_party" ? (
        <p className="rounded-2xl border border-dashed border-[#12343B]/20 p-5 text-sm text-[#4C6267]">
          This workspace is operated by Spurs, so there is no separate site to connect.
        </p>
      ) : !canManage ? (
        <p className="rounded-2xl border border-dashed border-[#12343B]/20 p-5 text-sm text-[#4C6267]">
          Ask a workspace owner or admin to connect the VTU site.
        </p>
      ) : (
        <ConnectSiteForm workspaceId={workspaceId} connection={connection} />
      )}
    </section>
  );
}
