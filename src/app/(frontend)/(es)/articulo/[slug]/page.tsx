import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticle, renderLexical } from "@/lib/cms";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getArticle(slug, "es") as (Record<string, unknown> & { title?: string; excerpt?: string; meta?: { title?: string; description?: string } }) | null;
  if (!a) return { title: "Artículo" };
  return {
    title: a.meta?.title || a.title,
    description: a.meta?.description || a.excerpt
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getArticle(slug, "es") as (Record<string, unknown> & { title?: string; excerpt?: string; body?: unknown; publishedAt?: string; sourceUrl?: string; category?: { slug?: string; name?: string }; coverImage?: { url?: string } }) | null;
  if (!a) notFound();

  const html = renderLexical(a.body);

  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      {a.category?.name && (
        <Link href={`/categoria/${a.category.slug}`} className="text-sm uppercase tracking-wide text-brand-accent font-semibold">
          {a.category.name}
        </Link>
      )}
      <h1 className="font-serif text-4xl md:text-5xl my-4">{a.title}</h1>
      {a.publishedAt && (
        <time className="text-sm text-brand-muted block mb-6">
          {new Date(a.publishedAt).toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" })}
        </time>
      )}
      {a.coverImage?.url && (
        <img src={a.coverImage.url} alt={a.title || ""} className="w-full rounded-lg mb-8" />
      )}
      {a.excerpt && <p className="text-lg text-brand-muted mb-8 leading-relaxed">{a.excerpt}</p>}
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      {a.sourceUrl && (
        <p className="mt-12 pt-6 border-t border-brand-soft text-sm text-brand-muted">
          Fuente original: <a href={a.sourceUrl} target="_blank" rel="noopener" className="text-brand-accent underline">{a.sourceUrl}</a>
        </p>
      )}
    </article>
  );
}
