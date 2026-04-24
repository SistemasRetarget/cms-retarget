import { jsonWithETag } from "@/lib/etag";
import { openApiSpec } from "@/lib/openapi";

export function GET(req: Request) {
  return jsonWithETag(req, openApiSpec, {
    maxAge: 3600,
    sMaxAge: 86400,
    staleWhileRevalidate: 86400,
  });
}
