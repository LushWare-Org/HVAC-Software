import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  check() {
    const databaseReady = this.prisma.isDatabaseReady();
    const schemaReady = this.prisma.isRequiredSchemaReady();

    return {
      status: databaseReady && schemaReady ? 'ok' : 'degraded',
      service: 'crm-service',
      databaseReady,
      schemaReady,
    };
  }
}
