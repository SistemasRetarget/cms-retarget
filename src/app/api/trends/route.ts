import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { analyzeTrends, type TrendArticleInput } from "@/lib/trends/analyzer";
import { getCached, setCached, invalidate } from "@/lib/trends/cache";
import { resolveConfig } from "@/lib/ai/providers";

function windowToMs(w: "24h" | "48h"): number {
  return w === "48h" ? 48 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
}

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const windowParam = (url.searchParams.get("window") || "24h") as "24h" | "48h";
  const win: "24h" | "48h" = windowParam === "48h" ? "48h" : "24h";
  const force = url.searchParams.get("refresh") === "1";

  const cacheKey = `trends:${win}`;
  if (!force) {
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json({ ...cached, fromCache: true });
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
    return NextResponse.json(
      { error: `Falta API key para ${aiCfg.provider}. Configúrala en AI Settings.` },
      { status: 400 }
    );
  }

  try {
    const result = await analyzeTrends(aiCfg, items, win);
    setCached(cacheKey, result);
    return NextResponse.json({ ...result, fromCache: false });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  invalidate();
  return NextResponse.json({ ok: true });
}
