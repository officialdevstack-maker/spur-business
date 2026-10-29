import { requireUser } from "@/lib/auth/session";
import { requireWorkspace } from "@/lib/workspaces/service";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#12343B]/10 py-3 last:border-0">
      <dt className="text-sm text-[#6A7E82]">{label}</dt>
      <dd className="break-all text-sm font-medium">{value}</dd>
    </div>
  );
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const { workspace, role } = await requireWorkspace(workspaceId, user.sub);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <dl className="rounded-2xl border border-[#12343B]/10 bg-white px-5 shadow-sm">
        <Row label="Name" value={workspace.name} />
        <Row label="Type" value={workspace.type === "vtu" ? "VTU business" : "School"} />
        <Row label="Address (permanent)" value={workspace.slug ?? "Not set"} />
        <Row label="Pay account" value={workspace.payIdentityId ? "Active" : "Pending"} />
        <Row label="Your role" value={role} />
      </dl>
    </section>
  );
}
