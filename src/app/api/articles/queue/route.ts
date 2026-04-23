import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const categorySlug = url.searchParams.get("category");
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);

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
}
