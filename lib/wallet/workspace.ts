import "server-only";

export class WalletServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "WalletServiceError";
  }
}

type WalletResponse = {
  asset: string;
  balance: string;
  display: string;
  userBalanceAfter?: string;
  workspaceBalanceAfter?: string;
};

async function requestWallet(path: string, init?: RequestInit): Promise<WalletResponse> {
  const secret = process.env.INTERNAL_API_SECRET;
  const baseUrl = process.env.SPURS_WALLET_URL;
  if (!secret) throw new Error("INTERNAL_API_SECRET must be set to connect to Spurs Wallet.");
  if (!baseUrl) throw new Error("SPURS_WALLET_URL must be set to connect to Spurs Wallet.");

  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": secret,
      ...init?.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Spurs Wallet request failed (${response.status}).`;
    throw new WalletServiceError(message, response.status);
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("asset" in payload) ||
    typeof payload.asset !== "string" ||
    !("display" in payload) ||
    typeof payload.display !== "string"
  ) {
    throw new Error("Spurs Wallet returned an invalid response.");
  }
  const asset = payload.asset;
  const display = payload.display;
  if ("balance" in payload && typeof payload.balance === "string") {
    return { asset, balance: payload.balance, display };
  }
  if ("workspaceBalanceAfter" in payload && typeof payload.workspaceBalanceAfter === "string") {
    return {
      asset,
      balance: payload.workspaceBalanceAfter,
      display,
      workspaceBalanceAfter: payload.workspaceBalanceAfter,
    };
  }
  throw new Error("Spurs Wallet returned an invalid balance.");
}

export async function getWorkspaceWallet(workspaceId: string): Promise<WalletResponse> {
  const balance = await requestWallet(
    `/api/private/wallet/workspace?workspace=${encodeURIComponent(workspaceId)}&asset=NGN`,
  );
  if (typeof balance.balance !== "string") {
    throw new Error("Spurs Wallet did not return a workspace balance.");
  }
  return balance;
}

export async function fundWorkspaceWallet(input: {
  userId: string;
  workspaceId: string;
  amountKobo: number;
  reference: string;
}): Promise<WalletResponse> {
  return requestWallet("/api/private/wallet/workspace/transfer", {
    method: "POST",
    body: JSON.stringify({
      user: input.userId,
      workspace: input.workspaceId,
      asset: "NGN",
      amount: input.amountKobo,
      reference: input.reference,
      description: "Business wallet funding",
    }),
  });
}
