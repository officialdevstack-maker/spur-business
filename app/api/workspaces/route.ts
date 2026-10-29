import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  countOwnedWorkspaces,
  createWorkspace,
  listUserWorkspaces,
} from "@/lib/workspaces/service";
import { validateCreateWorkspace } from "@/lib/workspaces/validators";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  try {
    const [rows, owned] = await Promise.all([
      listUserWorkspaces(user.sub),
      countOwnedWorkspaces(user.sub),
    ]);

    return NextResponse.json({
      workspaces: rows.map(({ workspace, role }) => ({ ...workspace, role })),
      owned,
      limit: 5,
    });
  } catch (error) {
    console.error("Could not list business workspaces.", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => undefined);
  const parsed = validateCreateWorkspace(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.fieldErrors },
      { status: 400 },
    );
  }

  try {
    const result = await createWorkspace(user.sub, parsed.data);
    if (!result.ok) {
      const status = result.error === "LIMIT_REACHED" ? 403 : 409;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ workspace: result.workspace }, { status: 201 });
  } catch (error) {
    console.error("Could not create business workspace.", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
