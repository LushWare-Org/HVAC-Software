/**
 * Socket.IO across several comms-service instances (Cloud Run scales out).
 * Without this, a message sent on one instance only reached people connected
 * to that same instance. With REDIS_URL (or REDIS_HOST) set, events are
 * shared through Redis; without it, a single instance works as before.
 */
import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private adapter?: ReturnType<typeof createAdapter>;
  private readonly logger = new Logger(RedisIoAdapter.name);

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connect(): Promise<boolean> {
    const url = process.env.REDIS_URL;
    const host = process.env.REDIS_HOST;
    if (!url && !host) return false;
    try {
      const opts = { maxRetriesPerRequest: null as null, lazyConnect: true };
      const pub = url ? new Redis(url, opts) : new Redis({ host, port: Number(process.env.REDIS_PORT ?? 6379), ...opts });
      const sub = pub.duplicate();
      await Promise.all([pub.connect(), sub.connect()]);
      this.adapter = createAdapter(pub, sub);
      this.logger.log('Socket.IO events shared through Redis');
      return true;
    } catch (err) {
      this.logger.warn(`Redis for Socket.IO unavailable, using a single instance: ${(err as Error).message}`);
      return false;
    }
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    if (this.adapter) server.adapter(this.adapter);
    return server;
  }
}
