"use client";

import { usePathname } from "next/navigation";
import { getNavSections } from "./nav-config";
import type { WorkspaceType } from "@/lib/constants";

export function PageTitle({
  workspaceId,
  workspaceName,
  type,
}: {
  workspaceId: string;
  workspaceName: string;
  type: WorkspaceType;
}) {
  const pathname = usePathname();
  const base = `/w/${workspaceId}`;

  const items = getNavSections(type).flatMap((section) => section.items);
  const match = items.find((item) => {
    const href = `${base}${item.path}`;
    return item.exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  });

  return (
    <div className="min-w-0">
      <h1 className="truncate text-base font-semibold leading-tight">{match?.label ?? "Workspace"}</h1>
      <p className="truncate text-xs text-[#6A7E82]">{workspaceName}</p>
    </div>
  );
}
