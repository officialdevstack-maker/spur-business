import Link from "next/link";
import { SpursAccountMenu } from "@spurs-cloud/accounts/react";
import { getSpursUser } from "@spurs-cloud/accounts/next";
import type { SessionUser } from "@/lib/auth/session";
import type { WorkspaceType } from "@/lib/constants";
import { PageTitle } from "./page-title";

type WorkspaceContext = {
  id: string;
  name: string;
  type: WorkspaceType;
  payActive: boolean;
};

export async function Topbar({
  user,
  workspace,
}: {
  user: SessionUser;
  workspace?: WorkspaceContext;
}) {
  const spursUser = await getSpursUser();
  const account = spursUser ? (
    <SpursAccountMenu user={spursUser} accent="#F2B632" accentTo="#D89B14" />
  ) : (
    <span className="text-sm">{user.name}</span>
  );

  if (!workspace) {
    return (
      <header className="flex items-center justify-between border-b border-[#12343B]/10 bg-white px-6 py-4 sm:px-10">
        <Link href="/workspaces" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-lg bg-[#F2B632] text-lg font-bold">
            S
          </span>
          Spurs Business
        </Link>
        {account}
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#12343B]/10 bg-white px-6 py-3 sm:px-10">
      <PageTitle workspaceId={workspace.id} workspaceName={workspace.name} type={workspace.type} />

      <div className="flex shrink-0 items-center gap-4">
        <Link
          href={`/w/${workspace.id}/settings`}
          title="Pay account status"
          className="hidden items-center gap-2 rounded-full border border-[#12343B]/10 px-3 py-1.5 text-xs font-medium hover:bg-[#12343B]/5 sm:flex"
        >
          <span
            className={`size-2 rounded-full ${workspace.payActive ? "bg-green-500" : "bg-[#F2B632]"}`}
          />
          Pay: {workspace.payActive ? "Active" : "Pending"}
        </Link>
        {account}
      </div>
    </header>
  );
}
