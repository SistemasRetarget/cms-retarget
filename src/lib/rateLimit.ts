// Simple in-memory rate limit. Para producción usar Upstash Redis o similar.
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max = 5, windowMs = 60_000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }
  if (entry.count >= max) return { ok: false, remaining: 0 };
  entry.count++;
  return { ok: true, remaining: max - entry.count };
}

// Limpieza periódica
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
  }, 60_000).unref?.();
}
