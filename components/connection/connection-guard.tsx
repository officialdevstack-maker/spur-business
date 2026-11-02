"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Icon } from "@/components/layout/icons";
import { NoInternetView } from "./no-internet-view";

const PROBE_URL = "/api/health";
const PROBE_INTERVAL_MS = 30_000;
const SLOW_AFTER_MS = 2_500;
const TIMEOUT_MS = 8_000;

type ConnectionInfo = {
  effectiveType?: string;
  addEventListener(type: "change", listener: () => void): void;
  removeEventListener(type: "change", listener: () => void): void;
};

function getConnection(): ConnectionInfo | undefined {
  return (navigator as Navigator & { connection?: ConnectionInfo }).connection;
}

function isSlowConnection(): boolean {
  const type = getConnection()?.effectiveType;
  return type === "slow-2g" || type === "2g";
}

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

type ProbeResult = "ok" | "slow" | "unreachable";

async function probe(): Promise<ProbeResult> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = performance.now();

  try {
    const response = await fetch(`${PROBE_URL}?t=${Date.now()}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return "unreachable";
    return performance.now() - started > SLOW_AFTER_MS ? "slow" : "ok";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "slow";
    return "unreachable";
  } finally {
    window.clearTimeout(timer);
  }
}

export function ConnectionGuard() {
  const online = useOnline();
  const [unreachable, setUnreachable] = useState(false);
  const [slow, setSlow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    const result = await probe();
    const isSlow = result === "slow" || (result === "ok" && isSlowConnection());
    setUnreachable(result === "unreachable");
    setSlow(isSlow);
    if (!isSlow) setDismissed(false);
  }, []);

  const retry = useCallback(async () => {
    setChecking(true);
    await check();
    setChecking(false);
  }, [check]);

  useEffect(() => {
    const initialCheck = window.setTimeout(() => void check(), 0);

    const onChange = () => void check();
    const interval = window.setInterval(onChange, PROBE_INTERVAL_MS);
    const connection = getConnection();

    window.addEventListener("online", onChange);
    connection?.addEventListener("change", onChange);

    return () => {
      window.clearTimeout(initialCheck);
      window.clearInterval(interval);
      window.removeEventListener("online", onChange);
      connection?.removeEventListener("change", onChange);
    };
  }, [check]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Could not register the offline service worker.", error);
    });
  }, []);

  if (!online || unreachable) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#EEF3F4]">
        <NoInternetView onRetry={retry} checking={checking} />
      </div>
    );
  }

  if (slow && !dismissed) {
    return (
      <div
        role="status"
        className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-[#12343B]/10 bg-white p-3 pr-2 shadow-lg"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#F2B632]/20">
          <Icon name="wifi" className="size-5" />
        </span>
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-semibold">Slow connection.</span>{" "}
          <span className="text-[#4C6267]">Pages may take longer to load. </span>
          <Link href="/slow-connection" className="font-semibold underline underline-offset-4">
            Tips
          </Link>
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-[#12343B]/5"
        >
          <Icon name="x" className="size-4" />
        </button>
      </div>
    );
  }

  return null;
}
