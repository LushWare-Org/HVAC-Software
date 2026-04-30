import {
  Injectable,
  INestApplication,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from './generated';

function withPrismaPoolParams(databaseUrl: string | undefined): string | undefined {
  if (!databaseUrl) {
    return databaseUrl;
  }

  const url = new URL(databaseUrl);
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', process.env.PRISMA_CONNECTION_LIMIT ?? '5');
  }
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', process.env.PRISMA_POOL_TIMEOUT ?? '20');
  }
  return url.toString();
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: withPrismaPoolParams(
            process.env.FINANCE_DATABASE_URL ?? process.env.DATABASE_URL,
          ),
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  enableShutdownHooks(app: INestApplication): void {
    app.enableShutdownHooks();
  }
}
