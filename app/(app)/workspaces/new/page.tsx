import { redirect } from "next/navigation";
import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";
import { MAX_OWNED_WORKSPACES } from "@/lib/constants";
import { requireUser } from "@/lib/auth/session";
import { countOwnedWorkspaces } from "@/lib/workspaces/service";

export default async function NewWorkspacePage() {
  const user = await requireUser();
  if ((await countOwnedWorkspaces(user.sub)) >= MAX_OWNED_WORKSPACES) {
    redirect("/workspaces");
  }

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Create a workspace</h1>
      <p className="mt-2 text-[#4C6267]">You can&apos;t change the type after creating it.</p>
      <div className="mt-8">
        <CreateWorkspaceForm />
      </div>
    </main>
  );
}
