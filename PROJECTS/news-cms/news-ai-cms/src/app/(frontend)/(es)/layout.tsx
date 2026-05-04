import Link from "next/link";
import { listCategories } from "@/lib/cms";

export default async function EsLayout({ children }: { children: React.ReactNode }) {
  let cats: Array<{ slug: string; name: string }> = [];
  try {
    cats = (await listCategories("es")) as unknown as Array<{ slug: string; name: string }>;
  } catch { /* DB aún no inicializada */ }

  return (
    <>
      <header className="border-b border-brand-soft bg-brand-bg/90 backdrop-blur sticky top-0 z-40">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl tracking-tight">News AI</Link>
          <ul className="hidden md:flex gap-6 text-sm">
            {cats.slice(0, 8).map((c) => (
              <li key={c.slug}>
                <Link href={`/categoria/${c.slug}`} className="hover:text-brand-accent">{c.name}</Link>
              </li>
            ))}
            <li><Link href="/admin" className="text-brand-muted hover:text-brand-accent">Admin</Link></li>
          </ul>
        </nav>
      </header>
      <main className="min-h-[60vh]">{children}</main>
      <footer className="mt-24 border-t border-brand-soft">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-4 text-sm text-brand-muted">
          <p className="font-serif text-base text-brand-ink">News AI · Blog de noticias con IA</p>
          <p>© {new Date().getFullYear()} News AI CMS</p>
        </div>
      </footer>
    </>
  );
}
