import { requireUser } from "@/lib/auth/session";
import { Topbar } from "@/components/layout/topbar";

export default async function WorkspacesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <Topbar user={user} />
      {children}
    </>
  );
}
