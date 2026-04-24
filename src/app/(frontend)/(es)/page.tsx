import Link from "next/link";
import { listArticles, listCategories } from "@/lib/cms";
import { buildHomeMetadata } from "@/lib/seo/metadata";
import { organizationSchema, websiteSchema } from "@/lib/seo/schema";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 60;

export function generateMetadata() {
  return buildHomeMetadata();
}

export default async function Home() {
  let articles: Array<Record<string, unknown>> = [];
  let cats: Array<{ slug: string; name: string }> = [];
  try {
    articles = (await listArticles({ limit: 18, locale: "es" })) as Array<Record<string, unknown>>;
    cats = (await listCategories("es")) as unknown as Array<{ slug: string; name: string }>;
  } catch { /* DB aún no lista */ }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <JsonLd data={[websiteSchema(), organizationSchema()]} />
      <section className="mb-16">
        <h1 className="font-serif text-5xl md:text-6xl mb-4">Noticias, curadas por IA</h1>
        <p className="text-brand-muted text-lg max-w-2xl">
          Artículos reescritos automáticamente a partir de fuentes confiables. Multi-categoría, multilingüe, siempre actualizado.
        </p>
      </section>

      {cats.length > 0 && (
        <nav className="flex flex-wrap gap-2 mb-10">
          {cats.map((c) => (
            <Link key={c.slug} href={`/categoria/${c.slug}`}
              className="px-4 py-1.5 border border-brand-soft rounded-full text-sm hover:bg-brand-soft transition">
              {c.name}
            </Link>
          ))}
        </nav>
      )}

      {articles.length === 0 ? (
        <div className="p-8 border border-brand-soft rounded-lg bg-brand-bg text-center">
          <p className="text-brand-muted mb-3">Aún no hay artículos publicados.</p>
          <p className="text-sm">
            Entra a <Link href="/admin" className="text-brand-accent underline">/admin</Link>, configura las credenciales de IA en <em>AI Settings</em>,
            agrega una <em>Source</em> RSS y presiona el botón <strong>Fetch ahora</strong> en el dashboard.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((a) => {
            const cat = a.category as { slug?: string; name?: string; color?: string } | undefined;
            return (
              <article key={String(a.id)} className="group">
                <Link href={`/articulo/${a.slug}`} className="block">
                  <div className="aspect-[16/10] bg-brand-soft mb-3 rounded overflow-hidden">
                    {(a.coverImage as { url?: string } | undefined)?.url && (
                      <img src={(a.coverImage as { url: string }).url} alt={String(a.title)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                  {cat?.name && (
                    <span className="text-xs uppercase tracking-wide font-semibold" style={{ color: cat.color || "#8b7355" }}>
                      {cat.name}
                    </span>
                  )}
                  <h2 className="font-serif text-xl mt-1 mb-2 group-hover:text-brand-accent transition-colors">{String(a.title)}</h2>
                  <p className="text-sm text-brand-muted line-clamp-3">{String(a.excerpt || "")}</p>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
