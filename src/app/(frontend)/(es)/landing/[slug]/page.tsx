import { notFound } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Metadata } from "next";
import type {
  HeroSection, FeaturesSection, CTASection,
  TestimonialsSection, FAQSection, StatsSection, LandingSection
} from "@/lib/ai/landing";

export const revalidate = 60;

async function getLanding(slug: string) {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "landing-pages",
    where: { slug: { equals: slug }, status: { equals: "published" } },
    limit: 1
  });
  return result.docs[0] ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const landing = await getLanding(slug);
  if (!landing) return { title: "No encontrado" };
  const meta = landing.meta as { title?: string; description?: string } | undefined;
  return {
    title: meta?.title || String(landing.title),
    description: meta?.description || ""
  };
}

// ── Bloques ─────────────────────────────────────────────────────────

function HeroBlock({ section, primaryColor }: { section: HeroSection; primaryColor: string }) {
  const bgMap = {
    dark: "bg-gray-900 text-white",
    gradient: "bg-gradient-to-br from-stone-50 to-stone-100",
    solid: ""
  };
  const isDark = section.backgroundType === "dark";

  return (
    <section
      className={`py-24 px-6 text-center ${bgMap[section.backgroundType] || ""}`}
      style={section.backgroundType === "solid" ? { backgroundColor: section.backgroundColor } : undefined}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className={`text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
          {section.headline}
        </h1>
        {section.subheadline && (
          <p className={`text-lg md:text-xl mb-10 max-w-2xl mx-auto ${isDark ? "text-gray-300" : "text-gray-600"}`}>
            {section.subheadline}
          </p>
        )}
        {section.ctaText && (
          <a
            href={section.ctaUrl || "#"}
            className="inline-block px-8 py-4 rounded-lg font-semibold text-white text-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            {section.ctaText}
          </a>
        )}
      </div>
    </section>
  );
}

function FeaturesBlock({ section, primaryColor }: { section: FeaturesSection; primaryColor: string }) {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">{section.title}</h2>
          {section.subtitle && <p className="text-gray-500 text-lg max-w-2xl mx-auto">{section.subtitle}</p>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {section.items?.map((item, i) => (
            <div key={i} className="p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              {item.icon && <div className="text-3xl mb-3">{item.icon}</div>}
              <h3 className="font-semibold text-gray-900 mb-2" style={{ color: primaryColor }}>{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABlock({ section, primaryColor }: { section: CTASection; primaryColor: string }) {
  const variants = {
    dark: "bg-gray-900 text-white",
    light: "bg-stone-50 text-gray-900",
    accent: "text-white"
  };
  const isAccent = section.variant === "accent";

  return (
    <section
      className={`py-20 px-6 text-center ${variants[section.variant]}`}
      style={isAccent ? { backgroundColor: primaryColor } : undefined}
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif font-bold mb-5">{section.headline}</h2>
        {section.description && (
          <p className={`text-lg mb-10 ${section.variant === "light" ? "text-gray-600" : "opacity-90"}`}>
            {section.description}
          </p>
        )}
        {section.buttonText && (
          <a
            href={section.buttonUrl || "#"}
            className="inline-block px-8 py-4 rounded-lg font-semibold text-lg transition-opacity hover:opacity-90"
            style={
              section.variant === "accent"
                ? { backgroundColor: "white", color: primaryColor }
                : { backgroundColor: primaryColor, color: "white" }
            }
          >
            {section.buttonText}
          </a>
        )}
      </div>
    </section>
  );
}

function TestimonialsBlock({ section }: { section: TestimonialsSection }) {
  return (
    <section className="py-20 px-6 bg-stone-50">
      <div className="max-w-6xl mx-auto">
        {section.title && (
          <h2 className="text-3xl font-serif font-bold text-gray-900 text-center mb-14">{section.title}</h2>
        )}
        <div className="grid md:grid-cols-2 gap-8">
          {section.items?.map((t, i) => (
            <div key={i} className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex mb-3">
                {Array.from({ length: t.rating || 5 }).map((_, j) => (
                  <span key={j} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 italic mb-6 leading-relaxed">"{t.text}"</p>
              <div>
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500">{t.role}{t.company ? ` · ${t.company}` : ""}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQBlock({ section, primaryColor }: { section: FAQSection; primaryColor: string }) {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-gray-900 text-center mb-12">{section.title}</h2>
        <div className="space-y-4">
          {section.items?.map((item, i) => (
            <details key={i} className="group border border-gray-200 rounded-lg overflow-hidden">
              <summary
                className="flex justify-between items-center p-5 cursor-pointer font-medium text-gray-900 hover:bg-stone-50 list-none"
              >
                <span>{item.question}</span>
                <span className="ml-4 text-xl transition-transform group-open:rotate-45" style={{ color: primaryColor }}>+</span>
              </summary>
              <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-gray-100">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsBlock({ section, primaryColor }: { section: StatsSection; primaryColor: string }) {
  return (
    <section className="py-16 px-6" style={{ backgroundColor: primaryColor }}>
      <div className="max-w-5xl mx-auto">
        {section.title && (
          <h2 className="text-2xl font-serif font-bold text-white text-center mb-10 opacity-90">{section.title}</h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {section.items?.map((stat, i) => (
            <div key={i}>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-white opacity-80 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RenderSection({ section, primaryColor }: { section: LandingSection; primaryColor: string }) {
  switch (section.blockType) {
    case "hero": return <HeroBlock section={section} primaryColor={primaryColor} />;
    case "features": return <FeaturesBlock section={section} primaryColor={primaryColor} />;
    case "cta": return <CTABlock section={section} primaryColor={primaryColor} />;
    case "testimonials": return <TestimonialsBlock section={section} />;
    case "faq": return <FAQBlock section={section} primaryColor={primaryColor} />;
    case "stats": return <StatsBlock section={section} primaryColor={primaryColor} />;
    default: return null;
  }
}

// ── Página ───────────────────────────────────────────────────────────

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const landing = await getLanding(slug);
  if (!landing) notFound();

  const sections = (landing.sections || []) as LandingSection[];
  const primaryColor = (landing.primaryColor as string) || "#8b7355";

  return (
    <main>
      {sections.map((section, i) => (
        <RenderSection key={i} section={section} primaryColor={primaryColor} />
      ))}
    </main>
  );
}
