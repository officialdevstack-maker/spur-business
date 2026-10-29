import { requireUser } from "@/lib/auth/session";
import { requireWorkspace } from "@/lib/workspaces/service";
import { Sidebar } from "@/components/layout/sidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const { workspace } = await requireWorkspace(workspaceId, user.sub);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 sm:px-10 md:flex-row">
      <Sidebar
        workspaceId={workspace.id}
        name={workspace.name}
        type={workspace.type}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
