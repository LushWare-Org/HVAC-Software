import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

@Injectable()
export class RateLimitService implements OnModuleDestroy {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly client: Redis;
  private connected = false;
  private readonly memory = new Map<string, number>();

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    this.client = redisUrl
      ? new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
        })
      : new Redis({
          host: this.config.get<string>('REDIS_HOST', 'localhost'),
          port: this.config.get<number>('REDIS_PORT', 6379),
          password: this.config.get<string>('REDIS_PASSWORD'),
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
        });

    this.client
      .connect()
      .then(() => {
        this.connected = true;
        this.logger.log('Redis connected — rate limiting is cluster-wide');
      })
      .catch((err) => {
        this.logger.warn(
          `Redis unavailable — rate limiting falls back to per-instance memory (${err.message})`,
        );
      });
  }

  async consume(keyId: string, limitPerMin: number): Promise<RateLimitDecision> {
    const windowSec = 60;
    const nowSec = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(nowSec / windowSec);
    const resetAt = (bucket + 1) * windowSec;
    const redisKey = `partner:rl:${keyId}:${bucket}`;

    const count = this.connected
      ? await this.incrRedis(redisKey, windowSec)
      : this.incrMemory(redisKey, resetAt);

    const remaining = Math.max(0, limitPerMin - count);
    return {
      allowed: count <= limitPerMin,
      limit: limitPerMin,
      remaining,
      resetAt,
      retryAfterSec: Math.max(1, resetAt - nowSec),
    };
  }

  private async incrRedis(redisKey: string, windowSec: number): Promise<number> {
    try {
      const [[, count]] = (await this.client
        .multi()
        .incr(redisKey)
        .expire(redisKey, windowSec * 2)
        .exec()) as [[Error | null, number], ...unknown[]];
      return count;
    } catch (err) {
      this.logger.warn(`Redis INCR failed, using memory counter: ${err}`);
      this.connected = false;
      return this.incrMemory(redisKey, Math.floor(Date.now() / 1000) + windowSec);
    }
  }

  private incrMemory(redisKey: string, resetAt: number): number {
    // Buckets are time-stamped in the key, so stale entries are simply pruned
    // whenever the map grows past a sane bound.
    if (this.memory.size > 10_000) {
      this.memory.clear();
    }
    const next = (this.memory.get(redisKey) ?? 0) + 1;
    this.memory.set(redisKey, next);
    void resetAt;
    return next;
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
