import "server-only";

import type { PoolClient } from "pg";
import { z } from "zod";
import { MAX_OWNED_WORKSPACES, MAX_PENDING_INVITES } from "@/lib/constants";
import { getPool } from "@/lib/db";
import type {
  InviteRole,
  UserInvite,
  WorkspaceInvite,
  WorkspaceRole,
} from "@/lib/db/schema";
import {
  canChangeRoles,
  canInviteRole,
  canManageTeam,
  canRemoveMember,
  canTransferOwnership,
} from "@/lib/workspaces/permissions";
import type { InviteInput } from "@/lib/workspaces/team-validators";

export type TeamErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "SELF_ACTION"
  | "ALREADY_MEMBER"
  | "ALREADY_INVITED"
  | "INVITE_LIMIT"
  | "INVITE_CLOSED"
  | "OWNER_CANNOT_LEAVE"
  | "LIMIT_REACHED";

export const TEAM_ERROR_STATUS: Record<TeamErrorCode, number> = {
  INVALID_INPUT: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  SELF_ACTION: 400,
  ALREADY_MEMBER: 409,
  ALREADY_INVITED: 409,
  INVITE_LIMIT: 409,
  INVITE_CLOSED: 409,
  OWNER_CANNOT_LEAVE: 409,
  LIMIT_REACHED: 403,
};

export type TeamResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: TeamErrorCode };

export function fail(error: TeamErrorCode): { ok: false; error: TeamErrorCode } {
  return { ok: false, error };
}

class TeamError extends Error {
  constructor(readonly code: TeamErrorCode) {
    super(code);
  }
}

const uuid = z.string().uuid();

async function runInWorkspace<T>(
  workspaceId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<TeamResult<T>> {
  if (!uuid.safeParse(workspaceId).success) return fail("NOT_FOUND");

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended('business-workspace-team:' || $1, 0))",
      [workspaceId],
    );
    const data = await fn(client);
    await client.query("COMMIT");
    return { ok: true, data };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Could not roll back team transaction.", rollbackError);
    }
    if (error instanceof TeamError) return fail(error.code);
    throw error;
  } finally {
    client.release();
  }
}

async function memberRole(
  client: PoolClient,
  workspaceId: string,
  userId: string,
): Promise<WorkspaceRole | null> {
  const { rows } = await client.query<{ role: WorkspaceRole }>(
    "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    [workspaceId, userId],
  );
  return rows[0]?.role ?? null;
}

async function requireRole(
  client: PoolClient,
  workspaceId: string,
  userId: string,
): Promise<WorkspaceRole> {
  const role = await memberRole(client, workspaceId, userId);
  if (!role) throw new TeamError("NOT_FOUND");
  return role;
}

export async function listPendingInvites(workspaceId: string): Promise<WorkspaceInvite[]> {
  const { rows } = await getPool().query<{
    id: string;
    email: string | null;
    inviteeUserId: string | null;
    role: InviteRole;
    invitedBy: string;
    createdAt: Date;
  }>(
    `SELECT id,
            email,
            invitee_user_id AS "inviteeUserId",
            role,
            invited_by AS "invitedBy",
            created_at AS "createdAt"
       FROM workspace_invites
      WHERE workspace_id = $1 AND status = 'pending'
      ORDER BY created_at DESC, id`,
    [workspaceId],
  );

  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function listInvitesForUser(
  userId: string,
  email: string | null,
): Promise<UserInvite[]> {
  const { rows } = await getPool().query<{
    id: string;
    workspaceId: string;
    workspaceName: string;
    workspaceType: UserInvite["workspaceType"];
    role: InviteRole;
    createdAt: Date;
  }>(
    `SELECT i.id,
            i.workspace_id AS "workspaceId",
            w.name AS "workspaceName",
            w.type AS "workspaceType",
            i.role,
            i.created_at AS "createdAt"
       FROM workspace_invites i
       JOIN workspaces w ON w.id = i.workspace_id
      WHERE i.status = 'pending'
        AND (i.invitee_user_id = $1 OR ($2::text IS NOT NULL AND i.email = $2::text))
      ORDER BY i.created_at DESC, i.id`,
    [userId, email],
  );

  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function countInvitesForUser(
  userId: string,
  email: string | null,
): Promise<number> {
  const { rows } = await getPool().query<{ count: number }>(
    `SELECT count(*)::int AS count
       FROM workspace_invites
      WHERE status = 'pending'
        AND (invitee_user_id = $1 OR ($2::text IS NOT NULL AND email = $2::text))`,
    [userId, email],
  );
  return rows[0]?.count ?? 0;
}

export async function createInvite(
  workspaceId: string,
  actorId: string,
  input: InviteInput,
): Promise<TeamResult<{ id: string }>> {
  return runInWorkspace(workspaceId, async (client) => {
    const actorRole = await requireRole(client, workspaceId, actorId);
    if (!canInviteRole(actorRole, input.role)) throw new TeamError("FORBIDDEN");
    if (input.kind === "user" && input.value === actorId) throw new TeamError("SELF_ACTION");

    const memberColumn = input.kind === "email" ? "email" : "user_id";
    const inviteColumn = input.kind === "email" ? "email" : "invitee_user_id";

    const existingMember = await client.query(
      `SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND ${memberColumn} = $2`,
      [workspaceId, input.value],
    );
    if (existingMember.rows.length > 0) throw new TeamError("ALREADY_MEMBER");

    const existingInvite = await client.query(
      `SELECT 1 FROM workspace_invites
        WHERE workspace_id = $1 AND status = 'pending' AND ${inviteColumn} = $2`,
      [workspaceId, input.value],
    );
    if (existingInvite.rows.length > 0) throw new TeamError("ALREADY_INVITED");

    const pending = await client.query<{ count: number }>(
      `SELECT count(*)::int AS count
         FROM workspace_invites WHERE workspace_id = $1 AND status = 'pending'`,
      [workspaceId],
    );
    if ((pending.rows[0]?.count ?? 0) >= MAX_PENDING_INVITES) {
      throw new TeamError("INVITE_LIMIT");
    }

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO workspace_invites (workspace_id, email, invitee_user_id, role, invited_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        workspaceId,
        input.kind === "email" ? input.value : null,
        input.kind === "user" ? input.value : null,
        input.role,
        actorId,
      ],
    );

    const invite = inserted.rows[0];
    if (!invite) throw new Error("Invite insert did not return a row.");
    return { id: invite.id };
  });
}

export async function revokeInvite(
  workspaceId: string,
  actorId: string,
  inviteId: string,
): Promise<TeamResult> {
  if (!uuid.safeParse(inviteId).success) return fail("NOT_FOUND");

  return runInWorkspace(workspaceId, async (client) => {
    const actorRole = await requireRole(client, workspaceId, actorId);
    if (!canManageTeam(actorRole)) throw new TeamError("FORBIDDEN");

    const { rows } = await client.query<{ role: InviteRole }>(
      `SELECT role FROM workspace_invites
        WHERE id = $1 AND workspace_id = $2 AND status = 'pending'
        FOR UPDATE`,
      [inviteId, workspaceId],
    );
    const invite = rows[0];
    if (!invite) throw new TeamError("NOT_FOUND");
    if (!canInviteRole(actorRole, invite.role)) throw new TeamError("FORBIDDEN");

    await client.query(
      "UPDATE workspace_invites SET status = 'revoked', responded_at = now() WHERE id = $1",
      [inviteId],
    );
    return null;
  });
}

export async function respondToInvite(
  inviteId: string,
  user: { id: string; name: string | null; email: string | null },
  action: "accept" | "decline",
): Promise<TeamResult<{ workspaceId: string; accepted: boolean }>> {
  if (!uuid.safeParse(inviteId).success) return fail("NOT_FOUND");

  const lookup = await getPool().query<{ workspaceId: string }>(
    'SELECT workspace_id AS "workspaceId" FROM workspace_invites WHERE id = $1',
    [inviteId],
  );
  const workspaceId = lookup.rows[0]?.workspaceId;
  if (!workspaceId) return fail("NOT_FOUND");

  return runInWorkspace(workspaceId, async (client) => {
    const { rows } = await client.query<{
      email: string | null;
      inviteeUserId: string | null;
      role: InviteRole;
      status: string;
    }>(
      `SELECT email, invitee_user_id AS "inviteeUserId", role, status
         FROM workspace_invites WHERE id = $1 FOR UPDATE`,
      [inviteId],
    );
    const invite = rows[0];
    if (!invite) throw new TeamError("NOT_FOUND");

    const isForUser =
      invite.inviteeUserId === user.id ||
      (invite.email !== null && user.email !== null && invite.email === user.email);
    if (!isForUser) throw new TeamError("NOT_FOUND");
    if (invite.status !== "pending") throw new TeamError("INVITE_CLOSED");

    if (action === "decline") {
      await client.query(
        "UPDATE workspace_invites SET status = 'declined', responded_at = now() WHERE id = $1",
        [inviteId],
      );
      return { workspaceId, accepted: false };
    }

    await client.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role, name, email)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (workspace_id, user_id) DO NOTHING`,
      [workspaceId, user.id, invite.role, user.name, user.email],
    );
    await client.query(
      "UPDATE workspace_invites SET status = 'accepted', responded_at = now() WHERE id = $1",
      [inviteId],
    );
    return { workspaceId, accepted: true };
  });
}

export async function changeMemberRole(
  workspaceId: string,
  actorId: string,
  targetId: string,
  role: InviteRole,
): Promise<TeamResult> {
  return runInWorkspace(workspaceId, async (client) => {
    const actorRole = await requireRole(client, workspaceId, actorId);
    if (!canChangeRoles(actorRole)) throw new TeamError("FORBIDDEN");
    if (targetId === actorId) throw new TeamError("SELF_ACTION");

    const targetRole = await memberRole(client, workspaceId, targetId);
    if (!targetRole) throw new TeamError("NOT_FOUND");
    if (targetRole === "owner") throw new TeamError("FORBIDDEN");

    await client.query(
      "UPDATE workspace_members SET role = $3 WHERE workspace_id = $1 AND user_id = $2",
      [workspaceId, targetId, role],
    );
    return null;
  });
}

export async function removeMember(
  workspaceId: string,
  actorId: string,
  targetId: string,
): Promise<TeamResult> {
  return runInWorkspace(workspaceId, async (client) => {
    const actorRole = await requireRole(client, workspaceId, actorId);

    if (targetId === actorId) {
      if (actorRole === "owner") throw new TeamError("OWNER_CANNOT_LEAVE");
    } else {
      const targetRole = await memberRole(client, workspaceId, targetId);
      if (!targetRole) throw new TeamError("NOT_FOUND");
      if (!canRemoveMember(actorRole, targetRole)) throw new TeamError("FORBIDDEN");
    }

    await client.query(
      "DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [workspaceId, targetId],
    );
    return null;
  });
}

export async function transferOwnership(
  workspaceId: string,
  actorId: string,
  targetId: string,
): Promise<TeamResult> {
  return runInWorkspace(workspaceId, async (client) => {
    const actorRole = await requireRole(client, workspaceId, actorId);
    if (!canTransferOwnership(actorRole)) throw new TeamError("FORBIDDEN");
    if (targetId === actorId) throw new TeamError("SELF_ACTION");

    const targetRole = await memberRole(client, workspaceId, targetId);
    if (!targetRole) throw new TeamError("NOT_FOUND");

    for (const userId of [actorId, targetId].sort()) {
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended('business-workspace-owner:' || $1, 0))",
        [userId],
      );
    }

    const owned = await client.query<{ count: number }>(
      `SELECT count(*)::int AS count
         FROM workspace_members WHERE user_id = $1 AND role = 'owner'`,
      [targetId],
    );
    if ((owned.rows[0]?.count ?? 0) >= MAX_OWNED_WORKSPACES) {
      throw new TeamError("LIMIT_REACHED");
    }

    await client.query(
      "UPDATE workspace_members SET role = 'admin' WHERE workspace_id = $1 AND user_id = $2",
      [workspaceId, actorId],
    );
    await client.query(
      "UPDATE workspace_members SET role = 'owner' WHERE workspace_id = $1 AND user_id = $2",
      [workspaceId, targetId],
    );
    return null;
  });
}
