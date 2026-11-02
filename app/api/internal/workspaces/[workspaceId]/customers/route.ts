import { NextResponse } from "next/server";
import { z } from "zod";
import { isInternalRequest } from "@/lib/auth/internal";
import { linkWorkspaceCustomer } from "@/lib/customers/service";
import { linkVtuWorkspaceCustomer, VtuInternalError } from "@/lib/vtu/client";

const Schema = z.object({
  userId: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(254).optional(),
});
const WorkspaceId = z.string().uuid();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const { workspaceId } = await params;
    if (!WorkspaceId.safeParse(workspaceId).success) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const customer = await linkWorkspaceCustomer({
      workspaceId,
      userId: parsed.data.userId,
      name: parsed.data.name ?? null,
      email: parsed.data.email?.toLowerCase() ?? null,
    });
    await linkVtuWorkspaceCustomer({
      workspaceId,
      userId: parsed.data.userId,
      name: parsed.data.name ?? null,
      email: parsed.data.email?.toLowerCase() ?? null,
    });
    return NextResponse.json({ customer });
  } catch (error) {
    if (error instanceof Error && error.message === "Customer could not be linked to this VTU workspace.") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    if (error instanceof VtuInternalError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("Could not link customer to VTU workspace.", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
