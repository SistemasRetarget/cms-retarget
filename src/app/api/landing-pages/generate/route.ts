import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { generateLandingPage, resolveConfig, type LandingBrief } from "@/lib/ai/landing";
import { generateLandingPageSchema } from "@/lib/schemas";
import { createRequestLogger } from "@/lib/logger";
import { rateLimit } from "@/lib/rateLimit";

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || "unknown";
  const log = createRequestLogger(requestId);

  try {
    const payload = await getPayload({ config });

    // Auth: solo admin
    const { user } = await payload.auth({ headers: req.headers });
    if (!user || (user as { role?: string }).role !== "admin") {
      log.warn("Unauthorized landing page generation attempt");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Rate limit: 10 requests per minute (AI generation is expensive)
    const rateLimitKey = `landing-gen:${user.id}`;
    const rateLimitResult = await rateLimit(rateLimitKey, 10, 60_000);
    if (!rateLimitResult.ok) {
      log.warn({ userId: user.id }, "Rate limit exceeded for landing page generation");
      return NextResponse.json(
        { error: "Too many requests, please try again later" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      log.warn("Invalid JSON in landing page generation request");
      return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
    }

    const validation = generateLandingPageSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten();
      log.warn({ errors }, "Validation failed for landing page generation");
      return NextResponse.json({ error: "Invalid request", details: errors }, { status: 400 });
    }

    const brief = validation.data as LandingBrief;
    log.info({ topic: brief.topic, tone: brief.tone }, "Generating landing page");

    // Obtener config AI
    const settings = await payload.findGlobal({ slug: "ai-settings" }) as Record<string, unknown>;
    const aiCfg = resolveConfig(settings as Parameters<typeof resolveConfig>[0]);
    if (!aiCfg.apiKey) {
      log.error({ provider: aiCfg.provider }, "Missing AI provider API key for landing page generation");
      return NextResponse.json(
        { error: `Falta API key para ${aiCfg.provider}. Configúrala en Admin → AI Settings.` },
        { status: 400 }
      );
    }

    // Generar con IA
    log.info({ provider: aiCfg.provider }, "Calling AI provider for landing page generation");
    const generated = await generateLandingPage(aiCfg, brief);

    // Deduplicar slug
    const baseSlug = slugify(generated.slug || brief.topic);
    const suffix = "-" + Date.now().toString(36).slice(-4);
    const slug = baseSlug + suffix;

    // Guardar en Payload
    const landing = await payload.create({
      collection: "landing-pages",
      data: {
        title: generated.title,
        slug,
        sections: generated.sections,
        status: "draft",
        aiGenerated: true,
        meta: {
          title: generated.meta_title,
          description: generated.meta_description
        }
      }
    });

    log.info({ id: landing.id, slug, sectionsCount: generated.sections.length }, "Landing page created successfully");

    return NextResponse.json({
      success: true,
      id: landing.id,
      slug,
      title: generated.title,
      sections: generated.sections.length,
      provider: aiCfg.provider,
      model: aiCfg.model,
      editUrl: `/admin/collections/landing-pages/${landing.id}`,
      previewUrl: `/landing/${slug}`
    });
  } catch (e) {
    log.error({ error: (e as Error).message }, "Failed to generate landing page");
    return NextResponse.json({ error: `Error: ${(e as Error).message}` }, { status: 500 });
  }
}
