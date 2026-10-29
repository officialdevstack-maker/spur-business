import "server-only";

import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { TEAM_ERROR_STATUS, type TeamResult } from "@/lib/workspaces/team";

export async function teamRoute<T>(
  handler: (user: SessionUser) => Promise<TeamResult<T>>,
  successStatus = 200,
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const result = await handler(user);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: TEAM_ERROR_STATUS[result.error] },
      );
    }
    return NextResponse.json({ data: result.data ?? null }, { status: successStatus });
  } catch (error) {
    console.error("Team request failed.", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
