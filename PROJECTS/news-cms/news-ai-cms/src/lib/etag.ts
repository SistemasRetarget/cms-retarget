import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Weak ETag + conditional response helper.
 * If the incoming If-None-Match matches, returns 304 Not Modified.
 * Otherwise returns the JSON with ETag + Cache-Control set.
 */
export function jsonWithETag(
  req: Request,
  data: unknown,
  opts: { maxAge?: number; sMaxAge?: number; staleWhileRevalidate?: number } = {}
): NextResponse {
  const body = JSON.stringify(data);
  const hash = createHash("sha1").update(body).digest("base64url").slice(0, 16);
  const etag = `W/"${hash}"`;

  const ifNoneMatch = req.headers.get("if-none-match");
  if (ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  const { maxAge = 60, sMaxAge = 300, staleWhileRevalidate = 600 } = opts;
  const cacheControl = `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ETag: etag,
      "Cache-Control": cacheControl,
    },
  });
}
