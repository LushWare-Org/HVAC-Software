import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from './generated';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.warn('Comms Prisma connection deferred during startup:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
