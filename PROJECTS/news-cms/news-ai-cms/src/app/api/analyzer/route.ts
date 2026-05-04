import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { analyzeSite } from "@/lib/analyzer";
import { analyzeSiteSchema } from "@/lib/schemas";
import { createRequestLogger } from "@/lib/logger";
import { rateLimit } from "@/lib/rateLimit";
import { requireFeature } from "@/lib/features";

/**
 * POST /api/analyzer
 * Body: { url: string }
 * Returns: SiteBlueprint
 *
 * Auth: requires admin or editor role. Rate limited at 10/min.
 * Feature gate: `analyzer`.
 */
export async function POST(req: NextRequest) {
  const gate = requireFeature("analyzer");
  if (gate) return gate;

  const requestId = req.headers.get("x-request-id") || "unknown";
  const log = createRequestLogger(requestId);

  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });
    if (!user) {
      log.warn("Unauthorized analyzer access");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const role = (user as { role?: string }).role;
    if (role !== "admin" && role !== "editor") {
      return NextResponse.json({ error: "Requiere rol editor o admin" }, { status: 403 });
    }

    const rlKey = `analyzer:${user.id}`;
    const rl = await rateLimit(rlKey, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
    }

    const validation = analyzeSiteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { url } = validation.data;
    log.info({ url }, "Analyzing site");

    const blueprint = await analyzeSite(url);
    log.info(
      {
        url,
        integrations: blueprint.integrations.length,
        htmlSize: blueprint.htmlSize,
      },
      "Site analyzed"
    );

    return NextResponse.json(blueprint);
  } catch (e) {
    log.error({ error: (e as Error).message }, "Analyzer failed");
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
