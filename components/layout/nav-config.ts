import type { WorkspaceType } from "@/lib/constants";
import type { IconName } from "./icons";

export type NavItem = {
  label: string;
  icon: IconName;
  path: string;
  exact?: boolean;
  soon?: boolean;
};

export type NavSection = { title?: string; items: NavItem[] };

export function getNavSections(type: WorkspaceType): NavSection[] {
  const isVtu = type === "vtu";

  return [
    {
      items: [
        { label: "Overview", icon: "home", path: "", exact: true },
        isVtu
          ? { label: "VTU business", icon: "phone", path: "/vtu" }
          : { label: "School site", icon: "school", path: "/school" },
      ],
    },
    {
      title: "Manage",
      items: isVtu
        ? [
            { label: "Wallet", icon: "wallet", path: "/wallet", soon: true },
            { label: "Bulk purchase", icon: "layers", path: "/bulk", soon: true },
            { label: "Transactions", icon: "receipt", path: "/transactions", soon: true },
            { label: "Customers", icon: "users", path: "/customers", soon: true },
          ]
        : [
            { label: "Students", icon: "users", path: "/students", soon: true },
            { label: "Classes", icon: "book", path: "/classes", soon: true },
            { label: "Fees & invoices", icon: "receipt", path: "/fees", soon: true },
            { label: "Payments", icon: "wallet", path: "/payments", soon: true },
          ],
    },
    {
      title: "Workspace",
      items: [
        { label: "Team", icon: "users", path: "/team", soon: true },
        { label: "Settings", icon: "settings", path: "/settings" },
      ],
    },
  ];
}
