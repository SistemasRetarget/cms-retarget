import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { createRequestLogger } from "@/lib/logger";
import { rejectArticleSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || "unknown";
  const log = createRequestLogger(requestId);

  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });

    if (!user) {
      log.warn("Unauthorized rejection attempt");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Rate limit: 30 requests per minute per user
    const rateLimitKey = `reject:${user.id}`;
    const rateLimitResult = await rateLimit(rateLimitKey, 30, 60_000);
    if (!rateLimitResult.ok) {
      log.warn({ userId: user.id }, "Rate limit exceeded for reject");
      return NextResponse.json(
        { error: "Too many requests, please try again later" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const role = (user as { role?: string }).role;
    if (role !== "admin" && role !== "editor") {
      log.warn({ userId: user.id, role }, "Insufficient permissions for rejection");
      return NextResponse.json({ error: "Requiere rol editor o admin" }, { status: 403 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      log.warn("Invalid JSON in request body");
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const validation = rejectArticleSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten();
      log.warn({ errors }, "Validation failed for reject request");
      return NextResponse.json({ error: "Invalid request", details: errors }, { status: 400 });
    }

    const { id, reason = "" } = validation.data;

    log.info({ articleId: id, userId: user.id, reason }, "Rejecting article");

    const updated = await payload.update({
      collection: "articles",
      id,
      data: {
        status: "draft",
        reviewedBy: user.id,
        reviewedAt: new Date().toISOString(),
        rejectionReason: reason || "Devuelto sin motivo especificado"
      }
    });

    log.info({ articleId: updated.id, title: updated.title }, "Article rejected successfully");
    return NextResponse.json({ ok: true, article: { id: updated.id, title: updated.title } });
  } catch (e) {
    log.error({ error: (e as Error).message }, "Article rejection failed");
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
