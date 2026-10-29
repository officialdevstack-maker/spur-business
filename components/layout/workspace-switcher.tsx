"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./icons";
import type { WorkspaceType } from "@/lib/constants";

export type SidebarWorkspace = { id: string; name: string; type: WorkspaceType };

const typeLabel = (type: WorkspaceType) => (type === "vtu" ? "VTU business" : "School");

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#F2B632] font-bold text-[#12343B]">
      {name.trim().charAt(0).toUpperCase() || "S"}
    </span>
  );
}

export function WorkspaceSwitcher({
  current,
  workspaces,
  canCreate,
  onNavigate,
  labelCls,
}: {
  current: SidebarWorkspace;
  workspaces: SidebarWorkspace[];
  canCreate: boolean;
  onNavigate: () => void;
  labelCls: string;
}) {
  const [open, setOpen] = useState(false);
  const others = workspaces.filter((workspace) => workspace.id !== current.id);

  function go() {
    setOpen(false);
    onNavigate();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left hover:bg-[#12343B]/5"
      >
        <Avatar name={current.name} />
        <span className={`min-w-0 flex-1 ${labelCls}`}>
          <span className="block truncate text-sm font-semibold">{current.name}</span>
          <span className="block text-xs text-[#6A7E82]">{typeLabel(current.type)}</span>
        </span>
        <Icon name="chevrons" className={`size-4 shrink-0 text-[#6A7E82] ${labelCls}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute inset-x-0 top-full z-20 mt-2 rounded-xl border border-[#12343B]/10 bg-white p-1.5 shadow-lg"
        >
          <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
            <Avatar name={current.name} />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{current.name}</span>
            <Icon name="check" className="size-4 text-[#12343B]" />
          </div>

          {others.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/w/${workspace.id}`}
              onClick={go}
              role="menuitem"
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-[#12343B]/5"
            >
              <Avatar name={workspace.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{workspace.name}</span>
                <span className="block text-xs text-[#6A7E82]">{typeLabel(workspace.type)}</span>
              </span>
            </Link>
          ))}

          <div className="my-1.5 border-t border-[#12343B]/10" />

          <Link
            href="/workspaces"
            onClick={go}
            role="menuitem"
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm hover:bg-[#12343B]/5"
          >
            <Icon name="grid" className="size-4" />
            All workspaces
          </Link>
          {canCreate && (
            <Link
              href="/workspaces/new"
              onClick={go}
              role="menuitem"
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm hover:bg-[#12343B]/5"
            >
              <Icon name="plus" className="size-4" />
              New workspace
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
