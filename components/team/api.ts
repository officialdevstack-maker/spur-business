"use client";

import type { InviteRole, WorkspaceRole } from "@/lib/db/schema";

type TeamErrorCode =
  | "UNAUTHENTICATED"
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

const TEAM_ERROR_MESSAGES: Record<TeamErrorCode, string> = {
  UNAUTHENTICATED: "Sign in again to continue.",
  INVALID_INPUT: "Check the information and try again.",
  NOT_FOUND: "That member or invitation could not be found.",
  FORBIDDEN: "You don't have permission to do that.",
  SELF_ACTION: "You can't perform that action on yourself.",
  ALREADY_MEMBER: "That person is already a workspace member.",
  ALREADY_INVITED: "There is already a pending invitation for that person.",
  INVITE_LIMIT: "This workspace has reached its pending invite limit.",
  INVITE_CLOSED: "That invitation is no longer available.",
  OWNER_CANNOT_LEAVE: "Transfer ownership before leaving this workspace.",
  LIMIT_REACHED: "That person already owns the maximum number of workspaces.",
};

export type TeamRequestResult =
  | { ok: true; data: unknown }
  | { ok: false; message: string };

export async function teamRequest(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<TeamRequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
      const code =
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : "";
      return {
        ok: false,
        message:
          code in TEAM_ERROR_MESSAGES
            ? TEAM_ERROR_MESSAGES[code as TeamErrorCode]
            : "Something went wrong. Try again.",
      };
    }

    const data =
      typeof payload === "object" && payload !== null && "data" in payload
        ? payload.data
        : null;
    return { ok: true, data };
  } catch (error) {
    console.error("Team request failed.", error);
    return {
      ok: false,
      message: "Could not reach the server. Check your connection and try again.",
    };
  }
}

export type { InviteRole, WorkspaceRole };
