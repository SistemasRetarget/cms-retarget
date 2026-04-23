import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { logger } from "@/lib/logger";

export function middleware(request: NextRequest) {
  const requestId = randomUUID();
  const response = NextResponse.next();

  // Attach request ID to response headers for client-side tracking
  response.headers.set("X-Request-ID", requestId);

  // Log incoming request
  logger.info(
    {
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    },
    "Incoming request"
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
