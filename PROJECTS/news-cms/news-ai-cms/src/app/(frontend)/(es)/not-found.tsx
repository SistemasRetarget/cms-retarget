import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-32 text-center">
      <h1 className="font-serif text-6xl mb-4">404</h1>
      <p className="text-brand-muted mb-8">La página que buscas no existe o fue movida.</p>
      <Link href="/" className="underline underline-offset-4 hover:text-brand-accent">Volver al inicio</Link>
    </div>
  );
}
