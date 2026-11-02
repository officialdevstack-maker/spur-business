import { NextResponse } from "next/server";
import { z } from "zod";
import { isInternalRequest } from "@/lib/auth/internal";
import { parseVtuBaseUrl } from "@/lib/vtu/config";
import { getPool } from "@/lib/db";

const WorkspaceId = z.string().uuid();
const Schema = z.object({ baseUrl: z.string().url() }).strict();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const { workspaceId } = await params;
  if (!WorkspaceId.safeParse(workspaceId).success) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  let target: ReturnType<typeof parseVtuBaseUrl>;
  try {
    target = parseVtuBaseUrl(parsed.data.baseUrl);
  } catch {
    return NextResponse.json({ error: "INVALID_VTU_URL" }, { status: 400 });
  }

  try {
    const pool = getPool();
    const host = await pool.query("SELECT 1 FROM vtu_host_allowlist WHERE host = $1", [target.host]);
    if (!host.rowCount) {
      return NextResponse.json({ error: "VTU_HOST_NOT_ALLOWED" }, { status: 403 });
    }

    const result = await pool.query(
      `INSERT INTO workspace_vtu_integrations (workspace_id, host, base_url)
       SELECT id, $2, $3 FROM workspaces WHERE id = $1 AND type = 'vtu'
       ON CONFLICT (workspace_id) DO UPDATE
         SET host = EXCLUDED.host, base_url = EXCLUDED.base_url, updated_at = now()
       RETURNING workspace_id`,
      [workspaceId, target.host, target.baseUrl],
    );
    if (!result.rowCount) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ workspaceId, host: target.host });
  } catch (error) {
    console.error("Could not configure workspace VTU integration.", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const { workspaceId } = await params;
  if (!WorkspaceId.safeParse(workspaceId).success) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const result = await getPool().query(
    "DELETE FROM workspace_vtu_integrations WHERE workspace_id = $1 RETURNING workspace_id",
    [workspaceId],
  );
  return result.rowCount
    ? NextResponse.json({ workspaceId, removed: true })
    : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}
