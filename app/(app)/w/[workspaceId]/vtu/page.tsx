import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getVtuWorkspaceAdmin } from "@/lib/vtu/client";
import { requireWorkspace } from "@/lib/workspaces/service";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const sections = [
  {
    title: "Products",
    description: "Networks, airtime and data plans, discounts, cable operators and plans.",
    slug: "products",
  },
  {
    title: "Providers",
    description: "Workspace provider connections and service endpoints.",
    slug: "providers",
  },
  {
    title: "Packages",
    description: "Customer packages and package pricing.",
    slug: "packages",
  },
  {
    title: "Transactions",
    description: "Purchases and transaction status for this workspace.",
    slug: "transactions",
  },
];

export default async function VtuPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const { workspace } = await requireWorkspace(workspaceId, user.sub);
  if (workspace.type !== "vtu") notFound();
  const overview = await getVtuWorkspaceAdmin(workspaceId, "overview");
  const transactionStats = isRecord(overview.transactions) ? overview.transactions : null;
  const stats: { label: string; value: unknown }[] = [
    { label: "Customers", value: overview.customers },
    { label: "Transactions", value: transactionStats?.total },
    { label: "Pending", value: transactionStats?.pending },
    { label: "Failed", value: transactionStats?.failed },
  ];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">VTU business</h1>
        <p className="mt-1 text-sm text-[#6A7E82]">
          Workspace-scoped products, providers, packages, customers and transactions.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-[#12343B]/10 bg-white p-5 shadow-sm">
            <p className="text-sm text-[#6A7E82]">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{typeof value === "number" ? value : "—"}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.slug}
            href={`/w/${workspaceId}/vtu/${section.slug}`}
            className="rounded-2xl border border-[#12343B]/10 bg-white p-5 transition hover:border-[#F2B632] hover:shadow-sm"
          >
            <h2 className="font-semibold">{section.title}</h2>
            <p className="mt-1 text-sm text-[#6A7E82]">{section.description}</p>
          </Link>
        ))}
      </div>
      <p className="rounded-2xl bg-[#12343B]/5 p-4 text-sm text-[#4C6267]">
        Spurs-wide payment gateway and platform settings remain managed by Spurs.
      </p>
    </section>
  );
}
