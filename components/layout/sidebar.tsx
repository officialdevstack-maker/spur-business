"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { getNavSections } from "./nav-config";
import { WorkspaceSwitcher, type SidebarWorkspace } from "./workspace-switcher";

type Props = {
  current: SidebarWorkspace & { payActive: boolean };
  workspaces: SidebarWorkspace[];
  canCreate: boolean;
};

const COLLAPSED_TEXT =
  "opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100";

function Panel({
  current,
  workspaces,
  canCreate,
  onNavigate,
  expanded,
}: Props & { onNavigate: () => void; expanded: boolean }) {
  const pathname = usePathname();
  const base = `/w/${current.id}`;
  const sections = getNavSections(current.type);
  const labelCls = expanded ? "" : COLLAPSED_TEXT;

  return (
    <div className={`flex h-full flex-col gap-4 px-3 py-4 ${expanded ? "w-full" : "w-64"}`}>
      <WorkspaceSwitcher
        current={current}
        workspaces={workspaces}
        canCreate={canCreate}
        onNavigate={onNavigate}
        labelCls={labelCls}
      />

      <nav className="flex-1 overflow-y-auto overflow-x-hidden" aria-label="Workspace">
        {sections.map((section, i) => (
          <div key={section.title ?? i} className={i > 0 ? "mt-3 border-t border-[#12343B]/10 pt-3" : ""}>
            {section.title && (
              <p
                className={`mb-1.5 whitespace-nowrap px-3.5 text-xs font-semibold uppercase tracking-wider text-[#6A7E82] ${labelCls}`}
              >
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const href = `${base}${item.path}`;
                const active = item.exact
                  ? pathname === href
                  : pathname === href || pathname.startsWith(`${href}/`);

                const content = (
                  <>
                    <Icon name={item.icon} className="size-5 shrink-0" />
                    <span className={`flex flex-1 items-center justify-between gap-2 whitespace-nowrap ${labelCls}`}>
                      {item.label}
                      {item.soon && (
                        <span className="rounded-full bg-[#12343B]/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          Soon
                        </span>
                      )}
                    </span>
                  </>
                );

                return (
                  <li key={item.path || "overview"}>
                    {item.soon ? (
                      <span
                        aria-disabled="true"
                        className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-[#12343B]/35"
                      >
                        {content}
                      </span>
                    ) : (
                      <Link
                        href={href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                          active
                            ? "bg-[#F2B632] text-[#12343B]"
                            : "text-[#12343B]/80 hover:bg-[#12343B]/5"
                        }`}
                      >
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

    </div>
  );
}

export function Sidebar(props: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const close = () => setDrawerOpen(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-[#12343B]/10 bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          className="grid size-9 place-items-center rounded-lg hover:bg-[#12343B]/5"
        >
          <Icon name="menu" />
        </button>
        <p className="truncate text-sm font-semibold">{props.current.name}</p>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="absolute inset-0 bg-[#12343B]/40"
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-xl">
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-lg hover:bg-[#12343B]/5"
            >
              <Icon name="x" className="size-4" />
            </button>
            <Panel {...props} onNavigate={close} expanded />
          </aside>
        </div>
      )}

      <div className="group/rail sticky top-0 hidden h-dvh w-[72px] shrink-0 overflow-hidden border-r border-[#12343B]/10 bg-white transition-[width] duration-200 hover:w-64 focus-within:w-64 md:block">
        <Panel {...props} onNavigate={() => {}} expanded={false} />
      </div>
    </>
  );
}
