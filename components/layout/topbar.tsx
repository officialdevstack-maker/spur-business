import Link from "next/link";
import { SpursAccountMenu } from "@spurs-cloud/accounts/react";
import type { SessionUser } from "@/lib/auth/session";

export function Topbar({ user }: { user: SessionUser }) {
  return (
    <header className="flex items-center justify-between border-b border-[#12343B]/10 bg-white px-6 py-4 sm:px-10">
      <Link
        href="/workspaces"
        className="flex items-center gap-3 font-semibold tracking-tight"
      >
        <span className="grid size-9 place-items-center rounded-lg bg-[#F2B632] text-lg font-bold">
          S
        </span>
        Spurs Business
      </Link>
      <SpursAccountMenu user={user} accent="#F2B632" accentTo="#D89B14" />
    </header>
  );
}
