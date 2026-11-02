import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { requireWorkspace } from "@/lib/workspaces/service";
import { fundWorkspaceWallet, WalletServiceError } from "@/lib/wallet/workspace";

const Schema = z.object({
  amountKobo: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  reference: z.string().uuid(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  try {
    const { workspaceId } = await params;
    const { workspace, role } = await requireWorkspace(workspaceId, user.sub);
    if (workspace.type !== "vtu") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    if (role !== "owner") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    if (workspace.operatorType !== "third_party") {
      return NextResponse.json({ error: "WORKSPACE_NOT_THIRD_PARTY" }, { status: 409 });
    }

    const result = await fundWorkspaceWallet({
      userId: user.sub,
      workspaceId,
      amountKobo: parsed.data.amountKobo,
      reference: `business-fund:${parsed.data.reference}`,
    });
    return NextResponse.json({ wallet: result });
  } catch (error) {
    if (error instanceof WalletServiceError) {
      const status = error.status === 400 ? 400 : error.status >= 500 ? 502 : 409;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("Could not fund workspace wallet.", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
