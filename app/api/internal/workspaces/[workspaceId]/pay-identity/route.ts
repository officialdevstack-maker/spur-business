import { NextResponse } from "next/server";
import { z } from "zod";
import { isInternalRequest } from "@/lib/auth/internal";
import { clearPayIdentity, setPayIdentity } from "@/lib/workspaces/service";

const uuid = z.string().uuid();

const bodySchema = z.object({
  payIdentityId: z.string().trim().min(1).max(128),
  replace: z.boolean().optional(),
});

type Context = { params: Promise<{ workspaceId: string }> };

export async function PUT(request: Request, { params }: Context) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { workspaceId } = await params;
  if (!uuid.safeParse(workspaceId).success) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => undefined);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  try {
    const result = await setPayIdentity(
      workspaceId,
      parsed.data.payIdentityId,
      parsed.data.replace ?? false,
    );
    if (!result.ok) {
      const status = result.error === "NOT_FOUND" ? 404 : 409;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ workspace: result.workspace });
  } catch (error) {
    console.error("Could not set workspace Pay identity.", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Context) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { workspaceId } = await params;
  if (!uuid.safeParse(workspaceId).success) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    const result = await clearPayIdentity(workspaceId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ workspace: result.workspace });
  } catch (error) {
    console.error("Could not clear workspace Pay identity.", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
