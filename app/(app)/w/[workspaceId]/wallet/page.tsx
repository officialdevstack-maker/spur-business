import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FundWorkspaceForm } from "@/components/wallet/fund-workspace-form";
import { requireUser } from "@/lib/auth/session";
import { requireWorkspace } from "@/lib/workspaces/service";
import { getWorkspaceWallet } from "@/lib/wallet/workspace";

export default function WorkspaceWalletPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <section className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Business wallet</h1>
          <p className="text-sm text-[#6A7E82]">Loading wallet…</p>
        </section>
      }
    >
      <WorkspaceWalletDetails params={params} />
    </Suspense>
  );
}

async function WorkspaceWalletDetails({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const { workspace } = await requireWorkspace(workspaceId, user.sub);
  if (workspace.type !== "vtu") notFound();

  const wallet = await getWorkspaceWallet(workspaceId);
  const canFund = workspace.operatorType === "third_party";

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business wallet</h1>
        <p className="mt-1 text-sm text-[#6A7E82]">
          Separate from your personal Spurs wallet and reserved for this VTU business.
        </p>
      </div>

      <div className="rounded-2xl border border-[#12343B]/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-[#6A7E82]">Available balance</p>
        <p className="mt-2 text-3xl font-bold tracking-tight">{wallet.display}</p>
        <p className="mt-2 text-xs text-[#6A7E82]">
          Operator: {workspace.operatorType === "spurs" ? "Spurs" : "Third-party business"}
        </p>
      </div>

      {canFund ? (
        <div className="rounded-2xl border border-[#12343B]/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Add funds</h2>
          <p className="mt-1 mb-5 text-sm text-[#4C6267]">
            Any workspace member can move funds from their personal Spurs wallet into this business wallet.
          </p>
          <FundWorkspaceForm workspaceId={workspaceId} />
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[#12343B]/20 p-5 text-sm text-[#4C6267]">
          {workspace.operatorType === "spurs"
            ? "This workspace is operated by Spurs. Its wallet is managed by Spurs administrators."
            : "This business wallet is only available to third-party workspaces."}
        </p>
      )}
    </section>
  );
}
