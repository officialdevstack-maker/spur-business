import { NextResponse } from "next/server";
import { z } from "zod";
import { isInternalRequest } from "@/lib/auth/internal";
import { parseVtuBaseUrl } from "@/lib/vtu/config";
import { getPool } from "@/lib/db";

const Schema = z.object({ baseUrl: z.string().url() }).strict();

export async function POST(request: Request) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
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
    await getPool().query(
      "INSERT INTO vtu_host_allowlist (host) VALUES ($1) ON CONFLICT (host) DO NOTHING",
      [target.host],
    );
    return NextResponse.json({ host: target.host }, { status: 201 });
  } catch (error) {
    console.error("Could not add trusted VTU host.", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
