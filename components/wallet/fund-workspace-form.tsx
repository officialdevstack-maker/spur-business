"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

function toKobo(value: string): number | null {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const naira = Number(match[1]);
  const kobo = Number((match[2] ?? "").padEnd(2, "0"));
  const total = naira * 100 + kobo;
  return Number.isSafeInteger(total) && total > 0 ? total : null;
}

export function FundWorkspaceForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const amountKobo = toKobo(amount);
    if (amountKobo === null) {
      setError("Enter an amount greater than zero, with no more than two decimal places.");
      return;
    }

    const requestReference = reference || crypto.randomUUID();
    setReference(requestReference);
    setPending(true);
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/wallet/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountKobo, reference: requestReference }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status < 500) setReference("");
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Could not fund the business wallet.";
        setError(message);
        return;
      }

      setAmount("");
      setReference("");
      router.refresh();
    } catch (submitError) {
      console.error("Could not fund the workspace wallet.", submitError);
      setError("Could not reach Spurs Wallet. Retry to safely check this transfer.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="wallet-fund-amount" className="text-sm font-medium">
          Amount (NGN)
        </label>
        <input
          id="wallet-fund-amount"
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
          required
          className="mt-2 w-full rounded-xl border border-[#12343B]/15 bg-white px-4 py-3 outline-none focus:border-[#F2B632]"
        />
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-xl bg-[#F2B632] px-5 font-semibold text-[#12343B] disabled:opacity-60"
      >
        {pending ? "Transferring…" : "Fund from my Spurs Wallet"}
      </button>
      <p className="text-xs leading-relaxed text-[#6A7E82]">
        This moves funds from your personal Spurs wallet into this business wallet.
      </p>
    </form>
  );
}
