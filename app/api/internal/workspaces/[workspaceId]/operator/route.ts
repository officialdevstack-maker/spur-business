import { NextResponse } from "next/server";
import { z } from "zod";
import { isInternalRequest } from "@/lib/auth/internal";
import { setVtuOperator } from "@/lib/workspaces/service";

const Schema = z.object({
  operatorType: z.enum(["spurs", "third_party"]),
});
const WorkspaceId = z.string().uuid();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  try {
    const { workspaceId } = await params;
    if (!WorkspaceId.safeParse(workspaceId).success) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const workspace = await setVtuOperator(workspaceId, parsed.data.operatorType);
    if (!workspace) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ workspace });
  } catch (error) {
    console.error("Could not update VTU workspace operator.", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
