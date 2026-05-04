/**
 * Cache en memoria para resultados de tendencias.
 * TTL corto (30 min) porque el análisis LLM es costoso.
 *
 * Versionado: bump CACHE_VERSION cuando el shape de TrendResult cambia
 * o cuando cambia la lógica del analizador — los entries viejos quedan
 * inaccesibles (otra key) y se purgan al vencer.
 */
import type { TrendResult } from "./analyzer";

const CACHE_VERSION = "v2";
const TTL_MS = 30 * 60 * 1000;

type CacheEntry = { data: TrendResult; expiresAt: number; version: string };
const store = new Map<string, CacheEntry>();

function versioned(key: string): string {
  return `${CACHE_VERSION}:${key}`;
}

export function getCached(key: string): TrendResult | null {
  const vkey = versioned(key);
  const entry = store.get(vkey);
  if (!entry) return null;
  if (entry.version !== CACHE_VERSION || Date.now() > entry.expiresAt) {
    store.delete(vkey);
    return null;
  }
  return entry.data;
}

export function setCached(key: string, data: TrendResult): void {
  const vkey = versioned(key);
  store.set(vkey, { data, expiresAt: Date.now() + TTL_MS, version: CACHE_VERSION });
}

export function invalidate(key?: string): void {
  if (key) {
    store.delete(versioned(key));
  } else {
    store.clear();
  }
}
