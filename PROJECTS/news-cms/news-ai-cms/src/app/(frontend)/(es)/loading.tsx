export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20 animate-pulse">
      <div className="h-96 bg-brand-soft mb-8 rounded" />
      <div className="h-8 bg-brand-soft rounded w-1/3 mb-4" />
      <div className="h-4 bg-brand-soft rounded w-2/3" />
    </div>
  );
}
