import type { ReactNode } from "react";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireUser } from "@/lib/auth/session";

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  await connection();
  await requireUser();

  return (
    <div className="min-h-dvh bg-[#EEF3F4] text-[#12343B]">{children}</div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center bg-[#EEF3F4] text-[#4C6267]">
          Loading…
        </div>
      }
    >
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
