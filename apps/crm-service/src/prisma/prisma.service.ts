import {
  Injectable,
  INestApplication,
  Logger,
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
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly dbSchema = this.resolveDbSchema();
  private databaseReady = false;
  private requiredSchemaReady = false;

  constructor() {
    super({
      datasources: {
        db: { url: withPrismaPoolParams(process.env.CRM_DATABASE_URL) },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'warn', 'error']
          : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    const connected = await this.waitForDatabase();
    if (!connected) {
      return;
    }

    await this.refreshRequiredSchemaReadiness();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  enableShutdownHooks(app: INestApplication): void {
    app.enableShutdownHooks();
  }

  isDatabaseReady(): boolean {
    return this.databaseReady;
  }

  isRequiredSchemaReady(): boolean {
    return this.databaseReady && this.requiredSchemaReady;
  }

  async ensureRequiredSchemaReady(): Promise<boolean> {
    if (!this.databaseReady && !(await this.waitForDatabase(1, 0))) {
      return false;
    }

    return this.refreshRequiredSchemaReadiness();
  }

  async tableExists(tableName: string): Promise<boolean> {
    this.assertIdentifier(tableName);

    const rows = await this.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = $1
            AND table_name = $2
        ) AS exists
      `,
      this.dbSchema,
      tableName,
    );

    return Boolean(rows[0]?.exists);
  }

  async columnExists(tableName: string, columnName: string): Promise<boolean> {
    this.assertIdentifier(tableName);

    const rows = await this.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = $1
            AND table_name = $2
            AND column_name = $3
        ) AS exists
      `,
      this.dbSchema,
      tableName,
      columnName,
    );

    return Boolean(rows[0]?.exists);
  }

  tableRef(tableName: string): string {
    this.assertIdentifier(tableName);
    return `"${this.dbSchema}"."${tableName}"`;
  }

  private async waitForDatabase(
    attempts = Number(process.env.CRM_DB_CONNECT_RETRIES ?? 15),
    delayMs = Number(process.env.CRM_DB_CONNECT_DELAY_MS ?? 2000),
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        await this.$connect();
        this.databaseReady = true;
        return true;
      } catch (error) {
        this.databaseReady = false;
        const message = error instanceof Error ? error.message : 'Unknown database connection error';

        if (attempt === attempts) {
          this.logger.error(`CRM database is not ready after ${attempts} attempt(s): ${message}`);
          return false;
        }

        this.logger.warn(`CRM database is not ready; retrying in ${delayMs}ms (${attempt}/${attempts})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return false;
  }

  private async refreshRequiredSchemaReadiness(): Promise<boolean> {
    try {
      this.requiredSchemaReady = await this.tableExists('companies');
      if (!this.requiredSchemaReady) {
        this.logger.warn('CRM database connected, but table "companies" is missing. Run crm-service Prisma migrations before enabling database-backed jobs.');
      }
    } catch (error) {
      this.requiredSchemaReady = false;
      this.logger.warn(`Unable to verify CRM database schema: ${error instanceof Error ? error.message : 'Unknown schema check error'}`);
    }

    return this.requiredSchemaReady;
  }

  private assertIdentifier(identifier: string): void {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
      throw new Error(`Invalid database identifier: ${identifier}`);
    }
  }

  private resolveDbSchema(): string {
    const url = process.env.CRM_DATABASE_URL;
    if (!url) {
      return 'public';
    }

    try {
      const schema = new URL(url).searchParams.get('schema') ?? 'public';
      return /^[A-Za-z_][A-Za-z0-9_]*$/.test(schema) ? schema : 'public';
    } catch {
      return 'public';
    }
  }
}
