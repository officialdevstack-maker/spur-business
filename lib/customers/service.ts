import "server-only";

import { getPool } from "@/lib/db";
import type { WorkspaceCustomer } from "@/lib/db/schema";

type CustomerRow = {
  userId: string;
  name: string | null;
  email: string | null;
  status: WorkspaceCustomer["status"];
  createdAt: Date;
  lastSeenAt: Date;
};

function toWorkspaceCustomer(row: CustomerRow): WorkspaceCustomer {
  return {
    userId: row.userId,
    name: row.name,
    email: row.email,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
  };
}

export async function listWorkspaceCustomers(workspaceId: string): Promise<WorkspaceCustomer[]> {
  const { rows } = await getPool().query<CustomerRow>(
    `SELECT user_id AS "userId",
            name,
            email,
            status,
            created_at AS "createdAt",
            last_seen_at AS "lastSeenAt"
       FROM workspace_customers
      WHERE workspace_id = $1
      ORDER BY last_seen_at DESC, user_id
      LIMIT 100`,
    [workspaceId],
  );
  return rows.map(toWorkspaceCustomer);
}

export async function linkWorkspaceCustomer(input: {
  workspaceId: string;
  userId: string;
  name: string | null;
  email: string | null;
}): Promise<WorkspaceCustomer> {
  const { rows } = await getPool().query<CustomerRow>(
    `INSERT INTO workspace_customers (workspace_id, user_id, name, email)
     SELECT w.id, $2, $3, $4
       FROM workspaces w
      WHERE w.id = $1 AND w.type = 'vtu'
     ON CONFLICT (workspace_id, user_id) DO UPDATE
       SET name = COALESCE(EXCLUDED.name, workspace_customers.name),
           email = COALESCE(EXCLUDED.email, workspace_customers.email),
           last_seen_at = now()
     RETURNING user_id AS "userId",
               name,
               email,
               status,
               created_at AS "createdAt",
               last_seen_at AS "lastSeenAt"`,
    [input.workspaceId, input.userId, input.name, input.email],
  );
  if (!rows[0]) throw new Error("Customer could not be linked to this VTU workspace.");
  return toWorkspaceCustomer(rows[0]);
}
