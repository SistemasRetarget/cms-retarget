import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { createRequestLogger } from "@/lib/logger";
import { approveArticleSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || "unknown";
  const log = createRequestLogger(requestId);

  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });

    if (!user) {
      log.warn("Unauthorized approval attempt");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Rate limit: 30 requests per minute per user
    const rateLimitKey = `approve:${user.id}`;
    const rateLimitResult = await rateLimit(rateLimitKey, 30, 60_000);
    if (!rateLimitResult.ok) {
      log.warn({ userId: user.id }, "Rate limit exceeded for approve");
      return NextResponse.json(
        { error: "Too many requests, please try again later" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const role = (user as { role?: string }).role;
    if (role !== "admin" && role !== "editor") {
      log.warn({ userId: user.id, role }, "Insufficient permissions for approval");
      return NextResponse.json({ error: "Requiere rol editor o admin" }, { status: 403 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      log.warn("Invalid JSON in request body");
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const validation = approveArticleSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten();
      log.warn({ errors }, "Validation failed for approve request");
      return NextResponse.json({ error: "Invalid request", details: errors }, { status: 400 });
    }

    const { id } = validation.data;

    log.info({ articleId: id, userId: user.id }, "Approving article");

    const updated = await payload.update({
      collection: "articles",
      id,
      data: {
        status: "published",
        publishedAt: new Date().toISOString(),
        reviewedBy: user.id,
        reviewedAt: new Date().toISOString(),
        rejectionReason: null
      }
    });

    log.info({ articleId: updated.id, title: updated.title }, "Article approved successfully");
    return NextResponse.json({ ok: true, article: { id: updated.id, title: updated.title } });
  } catch (e) {
    log.error({ error: (e as Error).message }, "Article approval failed");
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
