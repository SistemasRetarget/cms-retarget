import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { collect, type SourceType } from "@/lib/collectors";
import { generateArticle, resolveConfig } from "@/lib/ai/providers";

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function lexicalFromText(body: string) {
  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return {
    root: {
      type: "root", format: "", indent: 0, version: 1, direction: null,
      children: (paragraphs.length ? paragraphs : [body]).map((text) => ({
        type: "paragraph", version: 1,
        children: [{ type: "text", text, version: 1 }]
      }))
    }
  };
}

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config });

  // Auth: usuario logueado admin o cron secret
  const cronSecret = req.headers.get("x-cron-secret");
  const isCron = cronSecret && cronSecret === process.env.CRON_SECRET;
  if (!isCron) {
    const { user } = await payload.auth({ headers: req.headers });
    if (!user || (user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const sourceId = url.searchParams.get("sourceId");

  // AI Settings
  const settings = await payload.findGlobal({ slug: "ai-settings" }) as Record<string, unknown>;
  const aiCfg = resolveConfig(settings as Parameters<typeof resolveConfig>[0]);
  if (!aiCfg.apiKey) {
    return NextResponse.json(
      { error: `Falta API key para ${aiCfg.provider}. Configúrala en AI Settings.` },
      { status: 400 }
    );
  }

  // Sources a procesar
  const where: Record<string, unknown> = sourceId
    ? { id: { equals: sourceId } }
    : { active: { equals: true } };
  const sources = await payload.find({ collection: "sources", where: where as never, limit: 100 });

  const report: { source: string; type: string; ok: number; errors: string[] }[] = [];

  for (const src of sources.docs) {
    const s = src as {
      id: string | number;
      name: string;
      url: string;
      type: string;
      maxArticlesPerFetch?: number;
      prompt?: string;
      metaToken?: string;
      categories?: Array<{ id: string | number } | string | number>;
      language?: string;
    };
    const errors: string[] = [];
    let ok = 0;

    try {
      // Recolectar items desde la fuente
      const items = await collect(s.url, s.type as SourceType, {
        max: s.maxArticlesPerFetch || 5,
        metaToken: s.metaToken,
        language: s.language
      });

      if (items.length === 0) {
        errors.push("No se encontraron items en la fuente");
        report.push({ source: s.name, type: s.type, ok, errors });
        continue;
      }

      const firstCatId = s.categories?.[0];
      const categoryId = typeof firstCatId === "object" && firstCatId !== null
        ? (firstCatId as { id: string | number }).id
        : firstCatId;

      for (const item of items) {
        // Deduplicar por URL original
        const existing = await payload.find({
          collection: "articles",
          where: { sourceUrl: { equals: item.url } },
          limit: 1
        });
        if (existing.totalDocs > 0) continue;

        // Generar artículo con IA
        let generated;
        try {
          generated = await generateArticle(
            { ...aiCfg, systemPrompt: s.prompt || aiCfg.systemPrompt },
            {
              title: item.title,
              content: item.content,
              url: item.url,
              language: item.language || s.language
            }
          );
        } catch (e) {
          errors.push(`"${item.title.slice(0, 40)}": ${(e as Error).message}`);
          continue;
        }

        const slug = slugify(generated.title) + "-" + Date.now().toString(36).slice(-4);
        const autoPublish = Boolean((settings as { autoPublish?: boolean }).autoPublish);

        try {
          await payload.create({
            collection: "articles",
            data: {
              title: generated.title,
              slug,
              excerpt: generated.excerpt,
              body: lexicalFromText(generated.body),
              category: categoryId as string,
              tags: generated.tags.map((tag) => ({ tag })),
              status: autoPublish ? "published" : "draft",
              publishedAt: autoPublish ? new Date().toISOString() : undefined,
              source: s.id,
              sourceUrl: item.url,
              aiProvider: aiCfg.provider,
              aiModel: aiCfg.model,
              meta: { title: generated.meta_title, description: generated.meta_description }
            }
          });
          ok++;
        } catch (e) {
          errors.push(`Guardar "${generated.title.slice(0, 40)}": ${(e as Error).message}`);
        }
      }

      await payload.update({
        collection: "sources",
        id: s.id,
        data: {
          lastFetchedAt: new Date().toISOString(),
          lastFetchStatus: errors.length === 0 ? "ok" : "error",
          lastFetchError: errors.join("\n").slice(0, 2000) || null
        }
      });
    } catch (e) {
      errors.push((e as Error).message);
      await payload.update({
        collection: "sources",
        id: s.id,
        data: { lastFetchStatus: "error", lastFetchError: (e as Error).message.slice(0, 2000) }
      }).catch(() => {});
    }

    report.push({ source: s.name, type: s.type, ok, errors });
  }

  return NextResponse.json({
    provider: aiCfg.provider,
    model: aiCfg.model,
    sources: report.length,
    articlesCreated: report.reduce((t, r) => t + r.ok, 0),
    report
  });
}
