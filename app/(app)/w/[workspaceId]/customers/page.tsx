import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { listWorkspaceCustomers } from "@/lib/customers/service";
import { requireWorkspace } from "@/lib/workspaces/service";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Africa/Lagos",
});

export default async function WorkspaceCustomersPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const { workspace } = await requireWorkspace(workspaceId, user.sub);
  if (workspace.type !== "vtu") notFound();

  const customers = await listWorkspaceCustomers(workspaceId);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-[#6A7E82]">
          People who have used this business. The same Spurs identity can be linked to other businesses.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#12343B]/10 bg-white shadow-sm">
        {customers.length === 0 ? (
          <p className="p-6 text-sm text-[#4C6267]">
            Customers will appear here when they make a purchase through this workspace.
          </p>
        ) : (
          <ul className="divide-y divide-[#12343B]/10">
            {customers.map((customer) => (
              <li key={customer.userId} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {customer.name ?? "Spurs customer"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#6A7E82]">
                    {customer.email ?? `Spurs ID ${customer.userId}`}
                  </p>
                </div>
                <span className="rounded-full bg-[#12343B]/5 px-3 py-1 text-xs capitalize">
                  {customer.status}
                </span>
                <span className="text-xs text-[#6A7E82]">
                  Last active {dateFormatter.format(new Date(customer.lastSeenAt))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
