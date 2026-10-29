import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

const sha256 = (value: string) => createHash("sha256").update(value).digest();

export function isInternalRequest(request: Request): boolean {
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected) {
    console.error("INTERNAL_API_KEY is not configured; rejecting internal request.");
    return false;
  }

  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;

  return timingSafeEqual(sha256(match[1]), sha256(expected));
}
