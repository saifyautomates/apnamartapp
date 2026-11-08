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
  private memory = new MemoryCache();
  private isAvailable = false;

  constructor(url: string) {
    this.client = new Redis(url, {
      lazyConnect: false,
      maxRetriesPerRequest: 0,
      connectTimeout: 300,
      retryStrategy: () => null, // don't hang or retry indefinitely
    });
    this.client.on("connect", () => {
      this.isAvailable = true;
    });
    this.client.on("ready", () => {
      this.isAvailable = true;
    });
    this.client.on("error", () => {
      this.isAvailable = false;
    });
    this.client.on("close", () => {
      this.isAvailable = false;
    });
  }

  async get(key: string): Promise<string | null> {
    if (!this.isAvailable) {
      return this.memory.get(key);
    }
    try {
      return await this.client.get(key);
    } catch {
      this.isAvailable = false;
      return this.memory.get(key);
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.memory.set(key, value, ttlSeconds);
    if (!this.isAvailable) return;
    try {
      await this.client.set(key, value, "EX", ttlSeconds);
    } catch {
      this.isAvailable = false;
    }
  }

  async del(key: string): Promise<void> {
    await this.memory.del(key);
    if (!this.isAvailable) return;
    try {
      await this.client.del(key);
    } catch {
      this.isAvailable = false;
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
