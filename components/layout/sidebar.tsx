"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { WorkspaceType } from "@/lib/constants";

export function Sidebar({
  workspaceId,
  name,
  type,
}: {
  workspaceId: string;
  name: string;
  type: WorkspaceType;
}) {
  const pathname = usePathname();
  const base = `/w/${workspaceId}`;

  const items = [
    { href: base, label: "Overview" },
    type === "vtu"
      ? { href: `${base}/vtu`, label: "VTU" }
      : { href: `${base}/school`, label: "School" },
    { href: `${base}/settings`, label: "Settings" },
  ];

  return (
    <aside className="w-full shrink-0 md:w-56">
      <div className="rounded-2xl border border-[#12343B]/10 bg-white p-4 shadow-sm">
        <p className="truncate font-semibold">{name}</p>
        <Link
          href="/workspaces"
          className="text-xs text-[#6A7E82] underline underline-offset-4"
        >
          Switch
        </Link>
      </div>

      <nav className="mt-3 flex gap-2 md:flex-col">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                active ? "bg-[#F2B632] text-[#12343B]" : "hover:bg-[#12343B]/5"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
