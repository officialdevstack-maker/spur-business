import "server-only";

import { randomBytes } from "node:crypto";
import { request as httpsRequest } from "node:https";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { PoolClient } from "pg";
import { encryptSecret } from "@/lib/crypto";
import { getPool } from "@/lib/db";
import { parseVtuBaseUrl } from "@/lib/vtu/config";

export type VtuConnection = {
  siteUrl: string;
  host: string;
  status: "pending" | "verified";
  verifyToken: string;
  verifiedAt: string | null;
};

export type ConnectResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const value = ip.toLowerCase();
    if (value.startsWith("::ffff:")) return true;
    const firstHextet = Number.parseInt(value.split(":")[0] || "0", 16);
    return (
      firstHextet < 0x2000 ||
      firstHextet >= 0x4000 ||
      value.startsWith("2001:db8:") ||
      value.startsWith("2001:0:") ||
      value.startsWith("2002:")
    );
  }

  const [a, b, c] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 &&
      (b === 0 ||
        b === 168 ||
        (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}

async function lookupPublicHost(hostname: string) {
  const addresses = await lookup(hostname, { all: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error("PRIVATE_HOST");
  }
  return addresses;
}

async function fetchVerificationProof(baseUrl: string): Promise<{ status: number; body: string }> {
  const url = new URL("/.well-known/spurs-business.json", baseUrl);
  if (process.env.NODE_ENV !== "production") {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    const body = await response.text();
    return { status: response.status, body };
  }

  const addresses = await lookupPublicHost(url.hostname);
  const address = addresses[0];
  if (!address) throw new Error("The site hostname did not resolve.");

  return new Promise((resolve, reject) => {
    const request = httpsRequest(
      url,
      {
        hostname: address.address,
        family: address.family,
        servername: url.hostname,
        headers: { Accept: "application/json", Host: url.host },
        timeout: 10_000,
      },
      (response) => {
        const chunks: Buffer[] = [];
        let length = 0;
        response.on("data", (chunk: Buffer | string) => {
          const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          length += data.length;
          if (length > 5_000) {
            request.destroy(new Error("The verification response is too large."));
            return;
          }
          chunks.push(data);
        });
        response.on("end", () => {
          resolve({
            status: response.statusCode ?? 502,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
        response.on("error", reject);
      },
    );
    request.on("timeout", () => request.destroy(new Error("VTU verification request timed out.")));
    request.on("error", reject);
    request.end();
  });
}

type ConnectionRow = {
  site_url: string;
  host: string;
  status: "pending" | "verified";
  verify_token: string;
  verified_at: Date | null;
};

function toConnection(row: ConnectionRow): VtuConnection {
  return {
    siteUrl: row.site_url,
    host: row.host,
    status: row.status,
    verifyToken: row.verify_token,
    verifiedAt: row.verified_at ? row.verified_at.toISOString() : null,
  };
}

export async function getVtuConnection(workspaceId: string): Promise<VtuConnection | null> {
  const { rows } = await getPool().query<ConnectionRow>(
    `SELECT site_url, host, status, verify_token, verified_at
       FROM workspace_vtu_connections WHERE workspace_id = $1`,
    [workspaceId],
  );
  return rows[0] ? toConnection(rows[0]) : null;
}

async function lockWorkspace(client: PoolClient, workspaceId: string): Promise<boolean> {
  const { rowCount } = await client.query(
    "SELECT id FROM workspaces WHERE id = $1 AND type = 'vtu' FOR UPDATE",
    [workspaceId],
  );
  return Boolean(rowCount);
}

async function lockHost(
  client: PoolClient,
  host: string,
): Promise<void> {
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended('vtu-site-host:' || $1, 0))", [host]);
}

async function hostIsTaken(
  client: PoolClient,
  host: string,
  workspaceId: string,
): Promise<boolean> {
  const { rowCount } = await client.query(
    `SELECT 1 FROM workspace_vtu_integrations WHERE host = $1 AND workspace_id <> $2
     UNION ALL
     SELECT 1 FROM workspace_vtu_connections WHERE host = $1 AND workspace_id <> $2
     LIMIT 1`,
    [host, workspaceId],
  );
  return Boolean(rowCount);
}

export async function startVtuConnection(
  workspaceId: string,
  rawUrl: string,
): Promise<ConnectResult<VtuConnection>> {
  const input = rawUrl.trim();
  if (!input || input.length > 2_048) {
    return fail("Enter a site address shorter than 2,048 characters.");
  }
  let target: ReturnType<typeof parseVtuBaseUrl>;
  try {
    target = parseVtuBaseUrl(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return fail("Enter your site's address, like https://yourvtu.com (HTTPS, no path).");
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    if (!(await lockWorkspace(client, workspaceId))) {
      await client.query("ROLLBACK");
      return fail("This VTU workspace is no longer available.");
    }
    await lockHost(client, target.host);

    const existing = await client.query<{ status: "pending" | "verified" }>(
      "SELECT status FROM workspace_vtu_connections WHERE workspace_id = $1",
      [workspaceId],
    );
    if (existing.rows[0]?.status === "verified") {
      await client.query("ROLLBACK");
      return fail("Disconnect your current site before connecting another.");
    }
    if (await hostIsTaken(client, target.host, workspaceId)) {
      await client.query("ROLLBACK");
      return fail("That site is already connected to or being verified by another workspace.");
    }

    const token = randomBytes(24).toString("hex");
    await client.query(
      `INSERT INTO workspace_vtu_connections (workspace_id, site_url, host, verify_token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (workspace_id) DO UPDATE
         SET site_url = EXCLUDED.site_url, host = EXCLUDED.host,
             verify_token = EXCLUDED.verify_token, status = 'pending', verified_at = NULL`,
      [workspaceId, target.baseUrl, target.host, token],
    );
    await client.query("COMMIT");

    const created = await getVtuConnection(workspaceId);
    if (!created) throw new Error("Connection insert did not return a row.");
    return { ok: true, data: created };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Could not roll back VTU site connection.", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function verifyVtuConnection(
  workspaceId: string,
): Promise<ConnectResult<{ secret: string }>> {
  const connection = await getVtuConnection(workspaceId);
  if (!connection) return fail("Enter your site address first.");
  if (connection.status === "verified") return fail("This site is already connected.");

  let target: ReturnType<typeof parseVtuBaseUrl>;
  try {
    target = parseVtuBaseUrl(connection.siteUrl);
    if (process.env.NODE_ENV === "production") {
      await lookupPublicHost(new URL(target.baseUrl).hostname);
    }
  } catch {
    return fail("That site address can't be used. Enter a public HTTPS address.");
  }

  let proof: unknown;
  try {
    const response = await fetchVerificationProof(target.baseUrl);
    if (response.status < 200 || response.status >= 300) {
      return fail(`Your site answered with ${response.status}. Check that the verification route is deployed.`);
    }
    if (response.body.length > 5_000) return fail("The verification response is too large.");
    proof = JSON.parse(response.body);
  } catch {
    return fail("We couldn't read /.well-known/spurs-business.json on your site. Check it's deployed, then try again.");
  }

  const record = proof as { workspaceId?: unknown; token?: unknown } | null;
  if (!record || record.workspaceId !== workspaceId || record.token !== connection.verifyToken) {
    return fail("The verification response doesn't match. Check the workspace ID and token.");
  }

  const secret = randomBytes(32).toString("hex");
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    if (!(await lockWorkspace(client, workspaceId))) {
      await client.query("ROLLBACK");
      return fail("This VTU workspace is no longer available.");
    }
    await lockHost(client, target.host);

    const current = await client.query<ConnectionRow>(
      `SELECT site_url, host, status, verify_token, verified_at
         FROM workspace_vtu_connections WHERE workspace_id = $1 FOR UPDATE`,
      [workspaceId],
    );
    const latest = current.rows[0];
    if (
      !latest ||
      latest.status !== "pending" ||
      latest.site_url !== connection.siteUrl ||
      latest.host !== connection.host ||
      latest.verify_token !== connection.verifyToken
    ) {
      await client.query("ROLLBACK");
      return fail("The connection changed while it was being verified. Try again.");
    }
    if (await hostIsTaken(client, target.host, workspaceId)) {
      await client.query("ROLLBACK");
      return fail("That site is already connected to another workspace.");
    }

    await client.query("INSERT INTO vtu_host_allowlist (host) VALUES ($1) ON CONFLICT (host) DO NOTHING", [
      target.host,
    ]);
    await client.query(
      `INSERT INTO workspace_vtu_integrations (workspace_id, host, base_url, secret_enc)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (workspace_id) DO UPDATE
         SET host = EXCLUDED.host, base_url = EXCLUDED.base_url,
             secret_enc = EXCLUDED.secret_enc, updated_at = now()`,
      [workspaceId, target.host, target.baseUrl, encryptSecret(secret)],
    );
    await client.query(
      "UPDATE workspace_vtu_connections SET status = 'verified', verified_at = now() WHERE workspace_id = $1",
      [workspaceId],
    );
    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Could not roll back VTU site verification.", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }

  return { ok: true, data: { secret } };
}

export async function disconnectVtuSite(workspaceId: string): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    if (!(await lockWorkspace(client, workspaceId))) {
      await client.query("ROLLBACK");
      return;
    }
    await client.query("DELETE FROM workspace_vtu_integrations WHERE workspace_id = $1", [workspaceId]);
    await client.query("DELETE FROM workspace_vtu_connections WHERE workspace_id = $1", [workspaceId]);
    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Could not roll back VTU site disconnection.", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}
