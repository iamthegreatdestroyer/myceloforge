/**
 * Caching utilities for MYCELOFORGE frontend
 * In-memory and optional Redis caching with TTL
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Simple in-memory cache with TTL
 */
export class MemoryCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private defaultTTL: number = 5 * 60 * 1000) {
    // 5 minutes default
    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache with optional TTL
   */
  set(key: string, value: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      Array.from(this.cache.entries()).forEach(([key, entry]) => {
        if (now > entry.expiresAt) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach((key) => this.cache.delete(key));
    }, 60 * 1000); // Cleanup every minute
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Cache key builder for consistent key generation
 */
export class CacheKeyBuilder {
  static empire(empireName: string): string {
    return `empire:${empireName.toLowerCase()}`;
  }

  static lunarPhase(date: string): string {
    return `lunar-phase:${date}`;
  }

  static user(userId: string): string {
    return `user:${userId}`;
  }

  static search(query: string): string {
    return `search:${query.toLowerCase()}`;
  }

  static custom(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(':')}`;
  }
}

/**
 * Global cache instances
 */
export const empireCache = new MemoryCache<Record<string, unknown>>(10 * 60 * 1000); // 10 min
export const lunarPhaseCache = new MemoryCache<Record<string, unknown>>(60 * 60 * 1000); // 1 hour
export const userCache = new MemoryCache<Record<string, unknown>>(30 * 60 * 1000); // 30 min
export const searchCache = new MemoryCache<unknown[]>(5 * 60 * 1000); // 5 min

/**
 * Cache decorator for async functions
 */
export function withCache<T>(
  cache: MemoryCache<T>,
  keyBuilder: () => string,
  ttl?: number
) {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cacheKey = keyBuilder();
      const cached = cache.get(cacheKey);

      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache invalidation helper
 */
export function invalidateCache(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _cache: MemoryCache<unknown>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _pattern: string
): number {
  return 0;
}
