import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import type { PoolClient, QueryResultRow } from "pg";
import { MAX_OWNED_WORKSPACES } from "@/lib/constants";
import { getPool } from "@/lib/db";
import type { Workspace, WorkspaceMember, WorkspaceRole } from "@/lib/db/schema";
import type { CreateWorkspaceInput } from "@/lib/workspaces/validators";
import { schoolSlugBase, schoolSlugCandidate } from "@/lib/workspaces/slug";

type WorkspaceRow = QueryResultRow & {
  id: string;
  name: string;
  type: Workspace["type"];
  slug: string | null;
  payIdentityId: string | null;
  createdAt: Date;
};

type WorkspaceMembershipRow = WorkspaceRow & {
  role: WorkspaceRole;
};

function toWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    slug: row.slug,
    payIdentityId: row.payIdentityId,
    createdAt: row.createdAt.toISOString(),
  };
}

const WORKSPACE_COLUMNS = `
  w.id,
  w.name,
  w.type,
  w.slug,
  w.pay_identity_id AS "payIdentityId",
  w.created_at AS "createdAt"
`;

export async function listUserWorkspaces(
  userId: string,
): Promise<{ workspace: Workspace; role: WorkspaceRole }[]> {
  const { rows } = await getPool().query<WorkspaceMembershipRow>(
    `SELECT ${WORKSPACE_COLUMNS}, wm.role
       FROM workspace_members wm
       JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = $1
      ORDER BY w.created_at DESC, w.id`,
    [userId],
  );

  return rows.map(({ role, ...workspace }) => ({
    workspace: toWorkspace(workspace),
    role,
  }));
}

export async function getLandingPath(userId: string): Promise<string> {
  const { rows } = await getPool().query<{ id: string }>(
    `SELECT w.id
       FROM workspace_members wm
       JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = $1
      ORDER BY w.created_at DESC, w.id
      LIMIT 2`,
    [userId],
  );

  if (rows.length === 0) return "/workspaces/new";
  if (rows.length === 1) return `/w/${rows[0].id}`;
  return "/workspaces";
}

export async function countOwnedWorkspaces(userId: string): Promise<number> {
  const { rows } = await getPool().query<{ count: number }>(
    `SELECT count(*)::int AS count
       FROM workspace_members
      WHERE user_id = $1 AND role = 'owner'`,
    [userId],
  );

  return rows[0]?.count ?? 0;
}

export async function getWorkspaceForUser(
  workspaceId: string,
  userId: string,
): Promise<{ workspace: Workspace; role: WorkspaceRole } | null> {
  const { rows } = await getPool().query<WorkspaceMembershipRow>(
    `SELECT ${WORKSPACE_COLUMNS}, wm.role
       FROM workspace_members wm
       JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = $1 AND w.id = $2`,
    [userId, workspaceId],
  );
  const row = rows[0];
  if (!row) return null;

  const { role, ...workspace } = row;
  return { workspace: toWorkspace(workspace), role };
}

export async function listWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const { rows } = await getPool().query<{
    userId: string;
    role: WorkspaceRole;
    joinedAt: Date;
  }>(
    `SELECT user_id AS "userId", role, created_at AS "joinedAt"
       FROM workspace_members
      WHERE workspace_id = $1
      ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
               created_at,
               user_id`,
    [workspaceId],
  );

  return rows.map((row) => ({
    userId: row.userId,
    role: row.role,
    joinedAt: row.joinedAt.toISOString(),
  }));
}

const uuid = z.string().uuid();

export const requireWorkspace = cache(async (workspaceId: string, userId: string) => {
  if (!uuid.safeParse(workspaceId).success) notFound();

  const row = await getWorkspaceForUser(workspaceId, userId);
  if (!row) notFound();

  return row;
});

export function schoolSiteUrl(slug: string | null): string {
  if (!slug) throw new Error("School workspace is missing its slug.");

  const baseUrl = process.env.SCHOOLS_BASE_URL;
  if (!baseUrl) throw new Error("SCHOOLS_BASE_URL must be configured.");

  return `${baseUrl.replace(/\/+$/, "")}/${encodeURIComponent(slug)}`;
}

async function findSchoolSlug(
  client: PoolClient,
  name: string,
): Promise<string | null> {
  const base = schoolSlugBase(name);

  for (let suffix = 0; suffix < 100; suffix += 1) {
    const candidate = schoolSlugCandidate(base, suffix);
    const { rows } = await client.query(
      "SELECT 1 FROM workspaces WHERE slug = $1",
      [candidate],
    );
    if (rows.length === 0) return candidate;
  }

  return null;
}

export async function createWorkspace(
  userId: string,
  input: CreateWorkspaceInput,
): Promise<
  | { ok: true; workspace: Workspace }
  | { ok: false; error: "LIMIT_REACHED" | "SLUG_UNAVAILABLE" }
> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended('business-workspace-owner:' || $1, 0))",
      [userId],
    );

    const owned = await client.query<{ count: number }>(
      `SELECT count(*)::int AS count
         FROM workspace_members
        WHERE user_id = $1 AND role = 'owner'`,
      [userId],
    );

    if ((owned.rows[0]?.count ?? 0) >= MAX_OWNED_WORKSPACES) {
      await client.query("ROLLBACK");
      return { ok: false, error: "LIMIT_REACHED" };
    }

    let slug: string | null = null;
    if (input.type === "school") {
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended('business-school-slugs', 0))",
      );
      slug = await findSchoolSlug(client, input.name);
      if (!slug) {
        await client.query("ROLLBACK");
        return { ok: false, error: "SLUG_UNAVAILABLE" };
      }
    }

    const inserted = await client.query<WorkspaceRow>(
      `INSERT INTO workspaces (name, type, slug)
       VALUES ($1, $2, $3)
       RETURNING id,
                 name,
                 type,
                 slug,
                 pay_identity_id AS "payIdentityId",
                 created_at AS "createdAt"`,
      [input.name, input.type, slug],
    );
    const row = inserted.rows[0];
    if (!row) throw new Error("Workspace insert did not return a row.");

    await client.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [row.id, userId],
    );
    await client.query("COMMIT");

    return { ok: true, workspace: toWorkspace(row) };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Could not roll back workspace creation transaction.", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}
