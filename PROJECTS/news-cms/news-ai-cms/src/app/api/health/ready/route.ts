import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { createRequestLogger } from "@/lib/logger";

export async function GET(_req: NextRequest) {
  const requestId = _req.headers.get("x-request-id") || "unknown";
  const log = createRequestLogger(requestId);

  try {
    log.debug("Readiness check: verifying database connection");
    const payload = await getPayload({ config });
    await payload.find({ collection: "users", limit: 1 });

    log.debug("Readiness check: database connected");
    return NextResponse.json({ ready: true, db: "ok" }, { status: 200 });
  } catch (error) {
    log.error({ error: (error as Error).message }, "Readiness check: database connection failed");
    return NextResponse.json(
      { ready: false, db: "error", message: (error as Error).message },
      { status: 503 }
    );
  }
}
