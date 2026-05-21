/**
 * Simple in-memory cache with TTL support.
 */
class ReliabilityCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  private static instance: ReliabilityCache;

  private constructor() {
    // Periodic cleanup
    if (typeof window === 'undefined') {
      setInterval(() => this.cleanup(), 1000 * 60 * 10); // Every 10m
    }
  }

  public static getInstance(): ReliabilityCache {
    if (!ReliabilityCache.instance) {
      ReliabilityCache.instance = new ReliabilityCache();
    }
    return ReliabilityCache.instance;
  }

  public set(key: string, data: any, ttlSeconds: number = 3600) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  public generateKey(prefix: string, data: any): string {
    return `${prefix}:${JSON.stringify(data)}`;
  }
}

export const reliabilityCache = ReliabilityCache.getInstance();
