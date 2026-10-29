import Link from "next/link";
import { SpursAccountMenu } from "@spurs-cloud/accounts/react";
import { getSpursUser } from "@spurs-cloud/accounts/next";
import type { SessionUser } from "@/lib/auth/session";

export async function Topbar({ user, compact = false }: { user: SessionUser; compact?: boolean }) {
  const spursUser = await getSpursUser();

  return (
    <header
      className={`flex items-center border-b border-[#12343B]/10 bg-white px-6 sm:px-10 ${
        compact ? "sticky top-0 z-10 justify-end py-3" : "justify-between py-4"
      }`}
    >
      {!compact && (
        <Link href="/workspaces" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-lg bg-[#F2B632] text-lg font-bold">
            S
          </span>
          Spurs Business
        </Link>
      )}
      {spursUser ? (
        <SpursAccountMenu user={spursUser} accent="#F2B632" accentTo="#D89B14" />
      ) : (
        <span className="text-sm">{user.name}</span>
      )}
    </header>
  );
}
