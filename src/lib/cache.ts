// Cache abstraction: Redis when REDIS_URL is set, in-memory otherwise.
// The app must keep working when Redis is down — cache failures are treated as misses.
import Redis from "ioredis";

type Entry = { value: string; expiresAt: number };

class MemoryCache {
  private store = new Map<string, Entry>();
  async get(key: string): Promise<string | null> {
    const e = this.store.get(key);
    if (!e) return null;
    if (e.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return e.value;
  }
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class RedisCache {
  private client: Redis;
  constructor(url: string) {
    this.client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
    this.client.on("error", () => {
      /* treated as miss; app keeps working */
    });
  }
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, value, "EX", ttlSeconds);
    } catch {
      /* ignore */
    }
  }
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {
      /* ignore */
    }
  }
}

export interface Cache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

let instance: Cache | null = null;
export function getCache(): Cache {
  if (!instance) {
    instance = process.env.REDIS_URL ? new RedisCache(process.env.REDIS_URL) : new MemoryCache();
  }
  return instance;
}

export const cache = {
  get: (key: string) => getCache().get(key),
  set: (key: string, value: string, ttlSeconds: number) => getCache().set(key, value, ttlSeconds),
  del: (key: string) => getCache().del(key),
};

export async function cachedJson<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const cache = getCache();
  const hit = await cache.get(key);
  if (hit) {
    try {
      return JSON.parse(hit) as T;
    } catch {
      /* fall through */
    }
  }
  const value = await fn();
  await cache.set(key, JSON.stringify(value), ttlSeconds);
  return value;
}
