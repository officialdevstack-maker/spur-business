"use client";

import { Icon } from "@/components/layout/icons";
import { useRouter } from "next/navigation";

export function NoInternetView({
  onRetry,
  checking = false,
}: {
  onRetry?: () => void;
  checking?: boolean;
}) {
  const router = useRouter();
  const retry = onRetry ?? (() => router.push("/"));

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#EEF3F4] px-6 py-12 text-[#12343B]">
      <section className="w-full max-w-md rounded-2xl border border-[#12343B]/10 bg-white p-8 text-center shadow-sm sm:p-10">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#F2B632]/20">
          <Icon name="wifi-off" className="size-7" />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">You&apos;re offline</h1>
        <p className="mt-3 leading-relaxed text-[#4C6267]">
          We can&apos;t reach Spurs Business right now. Check your Wi-Fi or mobile data, then
          try again. Anything you&apos;ve already loaded will still be here when you&apos;re
          back.
        </p>
        <button
          type="button"
          onClick={retry}
          disabled={checking}
          className="mt-8 h-12 w-full rounded-xl bg-[#F2B632] px-6 font-semibold text-[#12343B] disabled:opacity-60"
        >
          {checking ? "Checking…" : "Try again"}
        </button>
      </section>
    </main>
  );
}
