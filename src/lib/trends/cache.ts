/**
 * Cache en memoria para resultados de tendencias.
 * TTL corto (30 min) porque el análisis LLM es costoso y las tendencias
 * no cambian al minuto.
 */
import type { TrendResult } from "./analyzer";

const TTL_MS = 30 * 60 * 1000;

type CacheEntry = { data: TrendResult; expiresAt: number };
const store = new Map<string, CacheEntry>();

export function getCached(key: string): TrendResult | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached(key: string, data: TrendResult): void {
  store.set(key, { data, expiresAt: Date.now() + TTL_MS });
}

export function invalidate(key?: string): void {
  if (key) store.delete(key);
  else store.clear();
}
