"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-32 text-center">
      <h1 className="font-serif text-4xl mb-4">Algo salió mal</h1>
      <p className="text-brand-muted mb-8">Intenta recargar la página.</p>
      <button onClick={reset} className="px-6 py-3 bg-brand-ink text-white hover:bg-brand-accent transition">
        Reintentar
      </button>
      {error.digest && <p className="mt-6 text-xs text-brand-muted">ID: {error.digest}</p>}
    </div>
  );
}
