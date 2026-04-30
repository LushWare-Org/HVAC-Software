import {
  Injectable,
  INestApplication,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from './generated';
import * as fs from 'fs';
import * as path from 'path';

function applyEnvFile(envPath: string): void {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function loadInventoryEnvFiles(): void {
  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env'),
  ];

  for (const envPath of candidatePaths) {
    applyEnvFile(envPath);
  }
}

function resolveInventoryDatabaseUrl(): string {
  loadInventoryEnvFiles();

  const directUrl = process.env.INVENTORY_DATABASE_URL;
  if (directUrl) {
    return directUrl;
  }

  const host = process.env.POSTGRES_HOST;
  const port = process.env.POSTGRES_PORT ?? '5432';
  const database = process.env.POSTGRES_DB;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;

  if (host && database && user && password) {
    return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=inventory`;
  }

  throw new Error(
    'Inventory database configuration is missing. Set INVENTORY_DATABASE_URL or the shared POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, and POSTGRES_PASSWORD variables.',
  );
}

function withPrismaPoolParams(databaseUrl: string): string {
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
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      datasources: { db: { url: withPrismaPoolParams(resolveInventoryDatabaseUrl()) } },
      log:
        process.env.NODE_ENV === 'development'
          ? ['warn', 'error']
          : ['warn', 'error'],
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
