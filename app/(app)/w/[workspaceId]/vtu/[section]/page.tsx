import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import {
  getVtuWorkspaceAdmin,
  listVtuWorkspaceTransactions,
} from "@/lib/vtu/client";
import { requireWorkspace } from "@/lib/workspaces/service";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown, label: string): JsonRecord[] {
  if (!Array.isArray(value) || !value.every(isRecord)) {
    throw new Error(`Spurs VTU returned invalid ${label} data.`);
  }
  return value;
}

function text(value: unknown, fallback = "—"): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

function enabled(value: unknown): string {
  return value === true ? "Enabled" : value === false ? "Disabled" : "—";
}

function ResourceHeader({ workspaceId, title }: { workspaceId: string; title: string }) {
  return (
    <div>
      <Link href={`/w/${workspaceId}/vtu`} className="text-sm text-[#6A7E82] hover:underline">
        VTU business
      </Link>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
    </div>
  );
}

function DataSection({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: JsonRecord[];
  columns: { key: string; label: string; format?: (value: unknown) => string }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#12343B]/10 bg-white shadow-sm">
      <h2 className="border-b border-[#12343B]/10 px-4 py-3 font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="p-5 text-sm text-[#6A7E82]">Nothing has been configured for this workspace yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#12343B]/5 text-xs uppercase text-[#6A7E82]">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3 font-semibold">{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#12343B]/10">
              {rows.map((row, index) => (
                <tr key={text(row.id, String(index))}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      {(column.format ?? text)(row[column.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default async function VtuAdminResourcePage({
  params,
}: {
  params: Promise<{ workspaceId: string; section: string }>;
}) {
  const { workspaceId, section } = await params;
  const user = await requireUser();
  const { workspace } = await requireWorkspace(workspaceId, user.sub);
  if (workspace.type !== "vtu") notFound();

  if (section === "transactions") {
    const transactions = await listVtuWorkspaceTransactions(workspaceId);
    return (
      <section className="space-y-5">
        <ResourceHeader workspaceId={workspaceId} title="Transactions" />
        <div className="overflow-hidden rounded-2xl border border-[#12343B]/10 bg-white shadow-sm">
          {transactions.length === 0 ? (
            <p className="p-5 text-sm text-[#6A7E82]">No transactions are recorded for this workspace yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#12343B]/5 text-xs uppercase text-[#6A7E82]">
                  <tr>
                    {["Customer", "Service", "Detail", "Amount", "Status", "Date"].map((label) => (
                      <th key={label} className="px-4 py-3 font-semibold">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#12343B]/10">
                  {transactions.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">{item.customerName ?? item.username ?? item.customerId}</td>
                      <td className="px-4 py-3 capitalize">{item.service}</td>
                      <td className="px-4 py-3">{item.title}: {item.detail}</td>
                      <td className="px-4 py-3">{item.amount}</td>
                      <td className="px-4 py-3 capitalize">{item.status}</td>
                      <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString("en-GB")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    );
  }

  const supported = ["products", "providers", "packages"] as const;
  const resourceName = supported.find((item) => item === section);
  if (!resourceName) notFound();
  const resource = await getVtuWorkspaceAdmin(workspaceId, resourceName);

  if (resourceName === "products") {
    const airtimeData = resource.airtimeData;
    if (!isRecord(airtimeData)) throw new Error("Spurs VTU returned invalid product data.");
    const networks = records(airtimeData.networks, "network");
    const cable = records(resource.cable, "cable operator");
    const productColumns = [
      { key: "name", label: "Name" },
      { key: "enabled", label: "Status", format: enabled },
      { key: "plans", label: "Plans", format: (value: unknown) => String(records(value, "plan").length) },
    ];
    return (
      <section className="space-y-6">
        <ResourceHeader workspaceId={workspaceId} title="Products" />
        <DataSection title="Networks" rows={networks} columns={productColumns} />
        <DataSection title="Cable operators" rows={cable} columns={productColumns} />
      </section>
    );
  }

  if (resourceName === "providers") {
    const providers = records(resource.providers, "provider");
    return (
      <section className="space-y-6">
        <ResourceHeader workspaceId={workspaceId} title="Providers" />
        <DataSection
          title="Workspace providers"
          rows={providers}
          columns={[
            { key: "name", label: "Name" },
            { key: "kind", label: "Type" },
            { key: "enabled", label: "Status", format: enabled },
            { key: "hasSecret", label: "Credentials", format: (value) => value === true ? "Configured" : "Not configured" },
            { key: "endpoints", label: "Services", format: (value) => String(records(value, "provider endpoint").length) },
          ]}
        />
        <p className="text-sm text-[#6A7E82]">Credential values are never returned by the VTU API.</p>
      </section>
    );
  }

  const packages = records(resource.packages, "package");
  return (
    <section className="space-y-6">
      <ResourceHeader workspaceId={workspaceId} title="Packages" />
      <DataSection
        title="Workspace packages"
        rows={packages}
        columns={[
          { key: "name", label: "Name" },
          { key: "description", label: "Description" },
          { key: "customers", label: "Customers" },
          { key: "upgradeFee", label: "Upgrade fee" },
        ]}
      />
    </section>
  );
}
