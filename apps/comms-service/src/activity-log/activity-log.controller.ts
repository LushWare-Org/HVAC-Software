import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '@tscrm/auth-client';
import { Role, clampPagination } from '@tscrm/types';
import type { ActivityLogEvent } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogProcessor } from './activity-log.processor';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';

/** Human-facing query API — super_admin only, every route. */
@Controller('activity-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class ActivityLogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: QueryActivityLogDto) {
    const { page, limit, skip } = clampPagination({ page: query.page, limit: query.limit });

    const where: Record<string, unknown> = {};
    if (query.companyId && query.companyId !== 'all') where.companyId = query.companyId;
    if (query.service) where.service = query.service;
    if (query.action) where.action = query.action;
    if (query.status) where.status = query.status;
    if (query.actorUserId) where.actorUserId = query.actorUserId;
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip }),
      this.prisma.activityLog.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  @Get('companies')
  async companies() {
    const rows = await this.prisma.activityLog.findMany({
      distinct: ['companyId'],
      select: { companyId: true, companyName: true },
      where: { companyId: { not: null } },
      orderBy: { companyName: 'asc' },
    });
    return rows.map((r) => ({ companyId: r.companyId, companyName: r.companyName }));
  }
}

/**
 * Internal ingest for services with no BullMQ client (scheduling-service,
 * Go). Deliberately NOT role-guarded — it's a service-to-service endpoint,
 * never called from a frontend, and carries no user JWT. It funnels into
 * the exact same write+broadcast path as every NestJS-originated event.
 */
@Controller('activity-log')
export class ActivityLogIngestController {
  constructor(private readonly processor: ActivityLogProcessor) {}

  @Post('ingest')
  async ingest(@Body() event: ActivityLogEvent) {
    await this.processor.handleEvent(event);
    return { accepted: true };
  }
}
