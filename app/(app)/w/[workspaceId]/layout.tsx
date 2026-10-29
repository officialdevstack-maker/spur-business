import { requireUser } from "@/lib/auth/session";
import { MAX_OWNED_WORKSPACES } from "@/lib/constants";
import { listUserWorkspaces, requireWorkspace } from "@/lib/workspaces/service";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const [{ workspace }, rows] = await Promise.all([
    requireWorkspace(workspaceId, user.sub),
    listUserWorkspaces(user.sub),
  ]);
  const owned = rows.filter((row) => row.role === "owner").length;

  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar
        current={{
          id: workspace.id,
          name: workspace.name,
          type: workspace.type,
          payActive: Boolean(workspace.payIdentityId),
        }}
        workspaces={rows.map(({ workspace: item }) => ({
          id: item.id,
          name: item.name,
          type: item.type,
        }))}
        canCreate={owned < MAX_OWNED_WORKSPACES}
      />
      <div className="min-w-0 flex-1">
        <Topbar user={user} compact />
        <div className="px-6 py-8 sm:px-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
