import "server-only";
import { getPool } from "@/lib/db";
import { parseVtuBaseUrl } from "@/lib/vtu/config";

export class VtuInternalError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "VtuInternalError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function getWorkspaceVtuBaseUrl(workspaceId: string): Promise<string> {
  const result = await getPool().query<{ host: string; base_url: string }>(
    `SELECT integration.host, integration.base_url
       FROM workspace_vtu_integrations integration
       JOIN vtu_host_allowlist allowed ON allowed.host = integration.host
       JOIN workspaces workspace ON workspace.id = integration.workspace_id
      WHERE integration.workspace_id = $1 AND workspace.type = 'vtu'`,
    [workspaceId],
  );
  const integration = result.rows[0];
  if (!integration) {
    throw new Error(`No trusted VTU integration is configured for workspace ${workspaceId}.`);
  }
  const parsed = parseVtuBaseUrl(integration.base_url);
  if (parsed.host !== integration.host) {
    throw new Error(`The VTU integration host for workspace ${workspaceId} is invalid.`);
  }
  return parsed.baseUrl;
}

async function request(workspaceId: string, path: string, init?: RequestInit): Promise<unknown> {
  const baseUrl = await getWorkspaceVtuBaseUrl(workspaceId);
  const secret = process.env.VTU_INTERNAL_API_SECRET;
  if (!secret) throw new Error("VTU_INTERNAL_API_SECRET must be configured.");

  const response = await fetch(new URL(path, baseUrl), {
    ...init,
    headers: {
      "x-business-internal-secret": secret,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : `Spurs VTU request failed (${response.status}).`;
    throw new VtuInternalError(message, response.status);
  }
  return body;
}

export type VtuWorkspaceCustomer = {
  userId: string;
  name: string | null;
  username: string | null;
  email: string | null;
  status: "active" | "suspended";
  createdAt: string;
  lastSeenAt: string;
};

export async function listVtuWorkspaceCustomers(
  workspaceId: string,
): Promise<VtuWorkspaceCustomer[]> {
  const result = await request(
    workspaceId,
    `/api/internal/business/workspaces/${encodeURIComponent(workspaceId)}/customers`,
  );
  if (!isRecord(result) || !Array.isArray(result.customers)) {
    throw new Error("Spurs VTU returned an invalid customer list.");
  }
  return result.customers.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.userId !== "string" ||
      !(item.name === null || typeof item.name === "string") ||
      !(item.username === null || typeof item.username === "string") ||
      !(item.email === null || typeof item.email === "string") ||
      (item.status !== "active" && item.status !== "suspended") ||
      typeof item.createdAt !== "string" ||
      typeof item.lastSeenAt !== "string"
    ) {
      throw new Error("Spurs VTU returned an invalid customer record.");
    }
    return {
      userId: item.userId,
      name: item.name,
      username: item.username,
      email: item.email,
      status: item.status,
      createdAt: item.createdAt,
      lastSeenAt: item.lastSeenAt,
    };
  });
}

export async function linkVtuWorkspaceCustomer(input: {
  workspaceId: string;
  userId: string;
  name: string | null;
  email: string | null;
}): Promise<void> {
  await request(
    input.workspaceId,
    `/api/internal/business/workspaces/${encodeURIComponent(input.workspaceId)}/customers`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export async function getVtuWorkspaceAdmin(
  workspaceId: string,
  resource: "overview" | "products" | "providers" | "packages",
): Promise<Record<string, unknown>> {
  const result = await request(
    workspaceId,
    `/api/internal/business/workspaces/${encodeURIComponent(workspaceId)}/admin?resource=${resource}`,
  );
  if (!isRecord(result)) throw new Error("Spurs VTU returned an invalid admin response.");
  return result;
}

export type VtuWorkspaceTransaction = {
  id: string;
  customerId: string;
  customerName: string | null;
  username: string | null;
  service: string;
  title: string;
  detail: string;
  amount: string;
  cost: string | null;
  direction: "debit" | "credit";
  status: "pending" | "success" | "failed";
  failureReason: string | null;
  createdAt: string;
};

export async function listVtuWorkspaceTransactions(
  workspaceId: string,
): Promise<VtuWorkspaceTransaction[]> {
  const result = await request(
    workspaceId,
    `/api/internal/business/workspaces/${encodeURIComponent(workspaceId)}/transactions`,
  );
  if (!isRecord(result) || !Array.isArray(result.transactions)) {
    throw new Error("Spurs VTU returned an invalid transaction list.");
  }
  return result.transactions.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      typeof item.customerId !== "string" ||
      !(item.customerName === null || typeof item.customerName === "string") ||
      !(item.username === null || typeof item.username === "string") ||
      typeof item.service !== "string" ||
      typeof item.title !== "string" ||
      typeof item.detail !== "string" ||
      typeof item.amount !== "string" ||
      !(item.cost === null || typeof item.cost === "string") ||
      (item.direction !== "debit" && item.direction !== "credit") ||
      (item.status !== "pending" && item.status !== "success" && item.status !== "failed") ||
      !(item.failureReason === null || typeof item.failureReason === "string") ||
      typeof item.createdAt !== "string"
    ) {
      throw new Error("Spurs VTU returned an invalid transaction record.");
    }
    return {
      id: item.id,
      customerId: item.customerId,
      customerName: item.customerName,
      username: item.username,
      service: item.service,
      title: item.title,
      detail: item.detail,
      amount: item.amount,
      cost: item.cost,
      direction: item.direction,
      status: item.status,
      failureReason: item.failureReason,
      createdAt: item.createdAt,
    };
  });
}
