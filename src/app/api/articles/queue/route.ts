import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { createRequestLogger } from "@/lib/logger";
import { articleQueueQuerySchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || "unknown";
  const log = createRequestLogger(requestId);

  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });

    if (!user) {
      log.warn("Unauthorized queue access attempt");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const queryParams = {
      category: url.searchParams.get("category") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    };

    const validation = articleQueueQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const errors = validation.error.flatten();
      log.warn({ errors }, "Validation failed for queue query");
      return NextResponse.json({ error: "Invalid query parameters", details: errors }, { status: 400 });
    }

    const { category: categorySlug, limit } = validation.data;

    log.info({ userId: user.id, categorySlug, limit }, "Fetching approval queue");

    const categories = await payload.find({
      collection: "categories",
      limit: 200,
      sort: "order"
    });

    const counts: Record<string, number> = {};
    await Promise.all(
      categories.docs.map(async (cat) => {
        const c = cat as unknown as { id: string | number; slug: string };
        const res = await payload.count({
          collection: "articles",
          where: {
            and: [
              { status: { equals: "review" } },
              { category: { equals: c.id } }
            ]
          } as never
        });
        counts[c.slug] = res.totalDocs;
      })
    );

    const totalReview = await payload.count({
      collection: "articles",
      where: { status: { equals: "review" } } as never
    });

    const where: Record<string, unknown> = { status: { equals: "review" } };
    if (categorySlug) {
      const cat = categories.docs.find(
        (c) => (c as unknown as { slug: string }).slug === categorySlug
      ) as unknown as { id: string | number } | undefined;
      if (cat) {
        (where as { and?: unknown[] }).and = [
          { status: { equals: "review" } },
          { category: { equals: cat.id } }
        ];
        delete (where as { status?: unknown }).status;
      }
    }

    const articles = await payload.find({
      collection: "articles",
      where: where as never,
      sort: "-createdAt",
      limit,
      depth: 2
    });

    log.info({ total: totalReview.totalDocs, articlesFound: articles.docs.length }, "Queue fetched successfully");

    return NextResponse.json({
      total: totalReview.totalDocs,
      counts,
      categories: categories.docs.map((c) => {
        const cat = c as unknown as { id: string | number; slug: string; name: string; color?: string };
        return { id: cat.id, slug: cat.slug, name: cat.name, color: cat.color };
      }),
      articles: articles.docs.map((a) => {
        const art = a as unknown as {
          id: string | number;
          title: string;
          excerpt?: string;
          slug: string;
          createdAt: string;
          sourceUrl?: string;
          category?: { id: string | number; name: string; slug: string; color?: string };
          source?: { id: string | number; name: string };
          aiProvider?: string;
        };
        return {
          id: art.id,
          title: art.title,
          excerpt: art.excerpt,
          slug: art.slug,
          createdAt: art.createdAt,
          sourceUrl: art.sourceUrl,
          category: art.category
            ? { id: art.category.id, name: art.category.name, slug: art.category.slug, color: art.category.color }
            : null,
          source: art.source ? { id: art.source.id, name: art.source.name } : null,
          aiProvider: art.aiProvider
        };
      })
    });
  } catch (e) {
    log.error({ error: (e as Error).message }, "Failed to fetch approval queue");
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
