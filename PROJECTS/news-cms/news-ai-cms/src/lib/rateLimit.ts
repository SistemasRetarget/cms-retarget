import { Redis } from "@upstash/redis";

// Try to initialize Upstash Redis; fallback to in-memory for development
let redis: Redis | null = null;
let useUpstash = false;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    useUpstash = true;
  } catch (e) {
    console.warn("Failed to initialize Upstash Redis, falling back to in-memory");
    useUpstash = false;
  }
}

// Fallback in-memory storage (for development or when Upstash unavailable)
const inMemoryHits = new Map<string, { count: number; resetAt: number }>();

async function getEntry(key: string): Promise<{ count: number; resetAt: number } | null> {
  if (useUpstash && redis) {
    const value = await redis.get<string>(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  } else {
    return inMemoryHits.get(key) || null;
  }
}

async function setEntry(key: string, entry: { count: number; resetAt: number }, ttlSeconds: number): Promise<void> {
  if (useUpstash && redis) {
    await redis.setex(key, ttlSeconds, JSON.stringify(entry));
  } else {
    inMemoryHits.set(key, entry);
  }
}

export async function rateLimit(
  key: string,
  max = 5,
  windowMs = 60_000
): Promise<{ ok: boolean; remaining: number }> {
  const now = Date.now();
  const entry = await getEntry(key);

  if (!entry || entry.resetAt < now) {
    const newEntry = { count: 1, resetAt: now + windowMs };
    const ttlSeconds = Math.ceil(windowMs / 1000);
    await setEntry(key, newEntry, ttlSeconds);
    return { ok: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    return { ok: false, remaining: 0 };
  }

  entry.count++;
  const ttlSeconds = Math.ceil((entry.resetAt - now) / 1000);
  await setEntry(key, entry, ttlSeconds);
  return { ok: true, remaining: max - entry.count };
}

// Cleanup for in-memory storage (only when Upstash not used)
if (!useUpstash && typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of inMemoryHits) {
      if (v.resetAt < now) {
        inMemoryHits.delete(k);
      }
    }
  }, 60_000).unref?.();
}
