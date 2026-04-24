import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { analyzeTrends, type TrendArticleInput } from "@/lib/trends/analyzer";
import { getCached, setCached, invalidate } from "@/lib/trends/cache";
import { resolveConfig } from "@/lib/ai/providers";
import { trendsQuerySchema } from "@/lib/schemas";
import { createRequestLogger } from "@/lib/logger";
import { rateLimit } from "@/lib/rateLimit";
import { requireFeature } from "@/lib/features";

function windowToMs(w: "24h" | "48h"): number {
  return w === "48h" ? 48 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
}

export async function GET(req: NextRequest) {
  const gate = requireFeature("trends");
  if (gate) return gate;

  const requestId = req.headers.get("x-request-id") || "unknown";
  const log = createRequestLogger(requestId);

  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });

    if (!user) {
      log.warn("Unauthorized trends access attempt");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Rate limit: 20 requests per minute (trends analysis is expensive)
    const rateLimitKey = `trends:${user.id}`;
    const rateLimitResult = await rateLimit(rateLimitKey, 20, 60_000);
    if (!rateLimitResult.ok) {
      log.warn({ userId: user.id }, "Rate limit exceeded for trends");
      return NextResponse.json(
        { error: "Too many requests, please try again later" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const url = new URL(req.url);
    const queryParams = {
      window: url.searchParams.get("window") || undefined,
      bypass_cache: url.searchParams.get("bypass_cache") || url.searchParams.get("refresh") || undefined,
    };

    const validation = trendsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const errors = validation.error.flatten();
      log.warn({ errors }, "Validation failed for trends query");
      return NextResponse.json({ error: "Invalid query parameters", details: errors }, { status: 400 });
    }

    const { window: win, bypass_cache: force } = validation.data;

    log.info({ window: win, bypassCache: force }, "Fetching trends");

    const cacheKey = `trends:${win}`;
    if (!force) {
      const cached = getCached(cacheKey);
      if (cached) {
        log.debug("Returning cached trends");
        return NextResponse.json({ ...cached, fromCache: true });
      }
    }

    const sinceIso = new Date(Date.now() - windowToMs(win)).toISOString();
    const articles = await payload.find({
      collection: "articles",
      where: {
        and: [
          { status: { equals: "published" } },
          { publishedAt: { greater_than: sinceIso } }
        ]
      } as never,
      sort: "-publishedAt",
      limit: 100,
      depth: 1
    });

    const items: TrendArticleInput[] = articles.docs.map((a) => {
      const art = a as unknown as {
        id: string | number;
        title: string;
        excerpt?: string;
        publishedAt?: string;
        category?: { slug?: string } | string | number;
      };
      const catSlug = typeof art.category === "object" && art.category !== null
        ? (art.category as { slug?: string }).slug
        : undefined;
      return {
        id: art.id,
        title: art.title,
        excerpt: art.excerpt,
        category: catSlug,
        publishedAt: art.publishedAt
      };
    });

    const settings = await payload.findGlobal({ slug: "ai-settings" }) as Record<string, unknown>;
    const aiCfg = resolveConfig(settings as Parameters<typeof resolveConfig>[0]);
    if (!aiCfg.apiKey) {
      log.error({ provider: aiCfg.provider }, "Missing AI provider API key");
      return NextResponse.json(
        { error: `Falta API key para ${aiCfg.provider}. Configúrala en AI Settings.` },
        { status: 400 }
      );
    }

    const result = await analyzeTrends(aiCfg, items, win);
    setCached(cacheKey, result);
    log.info({ trendsCount: result.trends.length }, "Trends analyzed successfully");
    return NextResponse.json({ ...result, fromCache: false });
  } catch (e) {
    log.error({ error: (e as Error).message }, "Failed to analyze trends");
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const gate = requireFeature("trends");
  if (gate) return gate;

  const requestId = req.headers.get("x-request-id") || "unknown";
  const log = createRequestLogger(requestId);

  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });

    if (!user) {
      log.warn("Unauthorized cache invalidation attempt");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    log.info({ userId: user.id }, "Invalidating trends cache");
    invalidate();
    return NextResponse.json({ ok: true });
  } catch (e) {
    log.error({ error: (e as Error).message }, "Failed to invalidate trends cache");
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
