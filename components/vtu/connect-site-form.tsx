"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { VtuConnection } from "@/lib/vtu/connection";
import {
  disconnectSiteAction,
  startConnectionAction,
  verifyConnectionAction,
  type ConnectActionResult,
} from "@/lib/vtu/connect-actions";

const card = "rounded-2xl border border-[#12343B]/10 bg-white p-6 shadow-sm";
const primary =
  "h-11 rounded-xl bg-[#F2B632] px-5 text-sm font-semibold text-[#12343B] disabled:opacity-60";
const ghost =
  "h-11 rounded-xl border border-[#12343B]/15 px-5 text-sm font-semibold hover:bg-[#12343B]/5 disabled:opacity-60";

export function ConnectSiteForm({
  workspaceId,
  connection,
}: {
  workspaceId: string;
  connection: VtuConnection | null;
}) {
  const router = useRouter();
  const [siteUrl, setSiteUrl] = useState(connection?.siteUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ConnectActionResult>) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (result.secret) setSecret(result.secret);
        router.refresh();
      } catch (cause) {
        console.error("Could not update the VTU site connection.", cause);
        setError("Something went wrong. Try again.");
      }
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending) run(() => startConnectionAction(workspaceId, siteUrl));
  }

  const proof = connection
    ? JSON.stringify({ workspaceId, token: connection.verifyToken }, null, 2)
    : "";

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {secret && (
        <div className={`${card} border-[#F2B632]`}>
          <h2 className="text-lg font-semibold">Your site secret</h2>
          <p className="mt-1 text-sm text-[#4C6267]">
            Copy it now. It won&apos;t be shown again. Set it on your VTU site as{" "}
            <code>BUSINESS_INTERNAL_API_SECRET</code>, then redeploy.
          </p>
          <input
            readOnly
            value={secret}
            onFocus={(event) => event.currentTarget.select()}
            aria-label="One-time VTU site secret"
            className="mt-3 w-full rounded-xl border border-[#12343B]/15 bg-white px-4 py-3 font-mono text-sm"
          />
        </div>
      )}

      {connection?.status === "verified" ? (
        <div className={card}>
          <p className="text-sm font-medium text-[#6A7E82]">Connected site</p>
          <p className="mt-1 break-all text-lg font-semibold">{connection.siteUrl}</p>
          <p className="mt-2 text-sm text-[#4C6267]">
            {secret ? (
              <>Set the secret above on your site as <code>BUSINESS_INTERNAL_API_SECRET</code>.</>
            ) : (
              <>
                The secret is only shown once. If you no longer have it, disconnect and reconnect this site to
                generate a replacement, then update your VTU site&apos;s <code>BUSINESS_INTERNAL_API_SECRET</code>.
              </>
            )}
          </p>
          <button
            type="button"
            disabled={pending}
            className={`${ghost} mt-4 text-red-600`}
            onClick={() => {
              if (window.confirm("Disconnect this site? Its data will stop showing in this workspace.")) {
                setSecret(null);
                run(() => disconnectSiteAction(workspaceId));
              }
            }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={onSubmit} className={`${card} space-y-4`}>
            <div>
              <label htmlFor="site-url" className="text-sm font-medium">
                Your VTU site link
              </label>
              <input
                id="site-url"
                type="url"
                value={siteUrl}
                onChange={(event) => setSiteUrl(event.target.value)}
                placeholder="https://yourvtu.com"
                maxLength={2_048}
                required
                className="mt-2 w-full rounded-xl border border-[#12343B]/15 bg-white px-4 py-3 outline-none focus:border-[#F2B632]"
              />
            </div>
            <button type="submit" disabled={pending} className={primary}>
              {pending ? "Saving…" : connection ? "Update link" : "Continue"}
            </button>
          </form>

          {connection && (
            <div className={`${card} space-y-4`}>
              <h2 className="text-lg font-semibold">Verify you own {connection.host}</h2>
              <p className="text-sm text-[#4C6267]">
                Add these environment variables to your VTU site and redeploy. The verification route is built
                into the VTU app and will return this proof to Spurs Business.
              </p>
              <pre className="overflow-x-auto rounded-xl bg-[#12343B]/5 p-4 text-xs">{proof}</pre>
              <p className="text-sm text-[#4C6267]">
                Set the values above as <code>SPURS_BUSINESS_WORKSPACE_ID</code> and{" "}
                <code>SPURS_BUSINESS_VERIFY_TOKEN</code> in your VTU site&apos;s server-side environment.
                Keep the token private.
              </p>
              <button
                type="button"
                disabled={pending}
                className={primary}
                onClick={() => run(() => verifyConnectionAction(workspaceId))}
              >
                {pending ? "Checking…" : "Verify and connect"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
