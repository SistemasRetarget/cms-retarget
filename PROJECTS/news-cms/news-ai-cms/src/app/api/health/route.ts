import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(_req: NextRequest) {
  const requestId = _req.headers.get("x-request-id") || "unknown";
  logger.debug({ requestId }, "Health check (liveness)");

  return NextResponse.json(
    { status: "ok", timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
