import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { generateLandingPage, resolveConfig, type LandingBrief } from "@/lib/ai/landing";

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config });

  // Auth: solo admin
  const { user } = await payload.auth({ headers: req.headers });
  if (!user || (user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let brief: LandingBrief;
  try {
    brief = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  if (!brief.topic || !brief.audience || !brief.goal) {
    return NextResponse.json(
      { error: "Se requieren: topic, audience, goal" },
      { status: 400 }
    );
  }

  // Obtener config AI
  const settings = await payload.findGlobal({ slug: "ai-settings" }) as Record<string, unknown>;
  const aiCfg = resolveConfig(settings as Parameters<typeof resolveConfig>[0]);
  if (!aiCfg.apiKey) {
    return NextResponse.json(
      { error: `Falta API key para ${aiCfg.provider}. Configúrala en Admin → AI Settings.` },
      { status: 400 }
    );
  }

  // Generar con IA
  let generated;
  try {
    generated = await generateLandingPage(aiCfg, brief);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  // Deduplicar slug
  const baseSlug = slugify(generated.slug || brief.topic);
  const suffix = "-" + Date.now().toString(36).slice(-4);
  const slug = baseSlug + suffix;

  // Guardar en Payload
  try {
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
    return NextResponse.json({ error: `Error al guardar: ${(e as Error).message}` }, { status: 500 });
  }
}
