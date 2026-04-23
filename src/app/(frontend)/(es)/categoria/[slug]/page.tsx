import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategory, listArticles } from "@/lib/cms";

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = await getCategory(slug, "es") as (Record<string, unknown> & { name?: string; description?: string }) | null;
  if (!cat) notFound();
  const articles = (await listArticles({ category: slug, limit: 50, locale: "es" })) as Array<Record<string, unknown>>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-serif text-5xl mb-3">{cat.name}</h1>
      {cat.description && <p className="text-brand-muted text-lg mb-10 max-w-2xl">{cat.description}</p>}

      {articles.length === 0 ? (
        <p className="text-brand-muted">Aún no hay artículos en esta categoría.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((a) => (
            <article key={String(a.id)}>
              <Link href={`/articulo/${a.slug}`} className="block group">
                <div className="aspect-[16/10] bg-brand-soft mb-3 rounded overflow-hidden">
                  {(a.coverImage as { url?: string } | undefined)?.url && (
                    <img src={(a.coverImage as { url: string }).url} alt={String(a.title)} className="w-full h-full object-cover" />
                  )}
                </div>
                <h2 className="font-serif text-xl mb-2 group-hover:text-brand-accent transition-colors">{String(a.title)}</h2>
                <p className="text-sm text-brand-muted line-clamp-3">{String(a.excerpt || "")}</p>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
