import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { requireWorkspace } from "@/lib/workspaces/service";

export default async function VtuPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const { workspace } = await requireWorkspace(workspaceId, user.sub);
  if (workspace.type !== "vtu") notFound();

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">VTU</h1>
      <p className="rounded-2xl border border-dashed border-[#12343B]/20 p-8 text-[#4C6267]">
        Wallet, bulk airtime and data purchases, and reseller tools will appear here.
      </p>
    </section>
  );
}
