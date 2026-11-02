"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/layout/icons";

const TIPS = [
  "Move closer to your router or to a spot with better signal.",
  "Switch between Wi-Fi and mobile data.",
  "Turn off data saver or low-data mode.",
  "Pause large downloads or streaming on the same network.",
];

export function SlowInternetView({ onRetry }: { onRetry?: () => void }) {
  const router = useRouter();
  const retry = onRetry ?? (() => router.push("/"));

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#EEF3F4] px-6 py-12 text-[#12343B]">
      <section className="w-full max-w-md rounded-2xl border border-[#12343B]/10 bg-white p-8 shadow-sm sm:p-10">
        <span className="grid size-14 place-items-center rounded-2xl bg-[#F2B632]/20">
          <Icon name="wifi" className="size-7" />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Your connection is slow</h1>
        <p className="mt-3 leading-relaxed text-[#4C6267]">
          Pages may take longer than usual to load. Nothing is wrong with your account — a
          few quick fixes may help:
        </p>
        <ul className="mt-5 space-y-2.5">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-start gap-3 text-sm text-[#4C6267]">
              <Icon name="check" className="mt-0.5 size-4 shrink-0 text-[#12343B]" />
              {tip}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={retry}
            className="h-12 flex-1 rounded-xl bg-[#F2B632] px-6 font-semibold text-[#12343B]"
          >
            Try again
          </button>
          <Link
            href="/workspaces"
            className="grid h-12 flex-1 place-items-center rounded-xl border border-[#12343B]/15 px-6 text-sm font-semibold hover:bg-[#12343B]/5"
          >
            Continue anyway
          </Link>
        </div>
      </section>
    </main>
  );
}
