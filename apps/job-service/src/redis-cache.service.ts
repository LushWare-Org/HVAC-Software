import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly client: Redis;
  private connected = false;

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    this.client = redisUrl
      ? new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false })
      : new Redis({
          host: this.config.get<string>('REDIS_HOST', 'localhost'),
          port: this.config.get<number>('REDIS_PORT', 6379),
          password: this.config.get<string>('REDIS_PASSWORD'),
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
        });

    this.client.connect().then(() => {
      this.connected = true;
      this.logger.log('Redis cache connected');
    }).catch(err => {
      this.logger.warn(`Redis unavailable — caching disabled (${err.message})`);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected) return null;
    try {
      const val = await this.client.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.connected) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // ignore cache write failures
    }
  }

  async del(pattern: string): Promise<void> {
    if (!this.connected) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length) await this.client.del(...keys);
    } catch {
      // ignore
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
