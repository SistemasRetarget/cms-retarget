import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { logger } from "@/lib/logger";

const ALLOWED_ORIGINS = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

export function middleware(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api");
  const origin = request.headers.get("origin");

  // CORS preflight for API routes
  if (isApi && request.method === "OPTIONS") {
    const headers = new Headers();
    if (isAllowedOrigin(origin)) {
      headers.set("Access-Control-Allow-Origin", origin!);
      headers.set("Access-Control-Allow-Credentials", "true");
      headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Request-ID, X-Cron-Secret"
      );
      headers.set("Access-Control-Max-Age", "86400");
    }
    return new NextResponse(null, { status: 204, headers });
  }

  // Propagate request ID to downstream handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Response headers
  response.headers.set("X-Request-ID", requestId);

  // CORS for actual API requests
  if (isApi && isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin!);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Security headers (skip Payload admin to avoid breaking its framing/CSP)
  if (!pathname.startsWith("/admin")) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  }

  logger.info(
    {
      requestId,
      method: request.method,
      path: pathname,
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    },
    "Incoming request"
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
  runtime: "nodejs", // Edge runtime doesn't support Node.js crypto module
};
