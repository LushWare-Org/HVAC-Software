import { Injectable } from '@nestjs/common';

interface Entry {
  value: unknown;
  expiresAt: number;
}

/**
 * Tiny in-process TTL cache for hot derived-read endpoints (e.g. customer
 * status-summary). Deliberately NOT Redis: crm-service has no ioredis
 * dependency today, the cached values are cheap-to-recompute aggregates with
 * short TTLs, and per-instance caching is effective even with multiple Cloud
 * Run instances. If a cached value ever needs cross-instance invalidation,
 * move it to a Redis-backed cache instead of growing this one.
 */
@Injectable()
export class TtlCacheService {
  private readonly store = new Map<string, Entry>();
  private static readonly MAX_ENTRIES = 5000;

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set(key: string, value: unknown, ttlMs: number): void {
    // Simple size cap — evict the oldest entries when full. Insertion order
    // is a good-enough proxy given the short TTLs involved.
    if (this.store.size >= TtlCacheService.MAX_ENTRIES) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) this.store.delete(firstKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  /** Delete every key starting with the given prefix. */
  delByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}
