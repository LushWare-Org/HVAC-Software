import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../redis-cache.service';
import { Prisma } from '../prisma/generated';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto, JobStatusDto, STATUS_TRANSITIONS } from './dto/update-job-status.dto';
import { AuthUser, PaginatedResponse, clampPagination } from '@tscrm/types';

const CREATE_JOB_MAX_ATTEMPTS = 5;
const STATS_CACHE_TTL_S = 30;

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  constructor(
    private prisma: PrismaService,
    private cache: RedisCacheService,
  ) {}

  // ============================================================
  // CREATE
  // ============================================================

  async create(user: AuthUser, dto: CreateJobDto) {
    const { customFields, ...rest } = dto;

    for (let attempt = 1; attempt <= CREATE_JOB_MAX_ATTEMPTS; attempt += 1) {
      try {
        const job = await this.prisma.$transaction(async (tx) => {
          const jobNumber = await this.generateJobNumber(tx, user.companyId);

          const createdJob = await tx.job.create({
            data: {
              ...rest,
              companyId: user.companyId,
              jobNumber,
              priority: (rest.priority ?? 'NORMAL') as any,
              scheduledStart: rest.scheduledStart ? new Date(rest.scheduledStart) : undefined,
              scheduledEnd: rest.scheduledEnd ? new Date(rest.scheduledEnd) : undefined,
              createdByUserId: user.userId,
              statusHistory: {
                create: {
                  toStatus: 'PENDING',
                  changedById: user.userId,
                  changedByName: user.name ?? user.email,
                  note: 'Job created',
                },
              },
              // If a template is specified, pre-create work order task completions
            },
            include: {
              jobType: true,
              template: { include: { tasks: { orderBy: { taskOrder: 'asc' } } } },
              customFieldValues: { include: { fieldDef: true } },
            },
          });

          if (customFields?.length) {
            await Promise.all(
              customFields.map((cf) =>
                tx.jobCustomFieldValue.upsert({
                  where: { jobId_fieldDefId: { jobId: createdJob.id, fieldDefId: cf.fieldDefId } },
                  update: { value: cf.value as any },
                  create: { jobId: createdJob.id, fieldDefId: cf.fieldDefId, value: cf.value as any },
                }),
              ),
            );
          }

          return createdJob;
        });

        await this.invalidateStatsCache(user.companyId);
        return this.findOne(user.companyId, job.id);
      } catch (error) {
        if (!this.isJobNumberUniqueError(error) || attempt === CREATE_JOB_MAX_ATTEMPTS) {
          throw error;
        }
      }
    }

    throw new BadRequestException('Unable to create job with a unique job number');
  }

  // ============================================================
  // LIST (paginated, filterable)
  // ============================================================

  async findAll(
    companyId: string,
    pageInput: number | string = 1,
    limitInput: number | string = 20,
    filters: {
      status?: string;
      assignedToId?: string;
      jobTypeId?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      customerId?: string;
      agreementId?: string;
      projectId?: string;
      projectIds?: string[];
      houseId?: string;
      equipmentId?: string;
      isAgreementJob?: boolean;
    } = {},
  ): Promise<PaginatedResponse<unknown>> {
    // Batch (multi-project) requests return rows for many projects in one
    // page, so they get a higher ceiling than the per-entity default.
    const { page, limit, skip } = clampPagination(
      { page: pageInput, limit: limitInput },
      filters.projectIds?.length ? { maxLimit: 500 } : {},
    );
    const where: any = { companyId };

    if (filters.status) where.status = filters.status;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.jobTypeId) where.jobTypeId = filters.jobTypeId;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.agreementId) where.agreementId = filters.agreementId;
    if (filters.projectId) where.projectId = filters.projectId;
    // Batch form: one request for many projects' jobs (Projects page overview)
    // instead of one request per project.
    if (filters.projectIds?.length) where.projectId = { in: filters.projectIds };
    if (filters.houseId) where.houseId = filters.houseId;
    if (filters.equipmentId) where.equipmentId = filters.equipmentId;
    if (filters.isAgreementJob !== undefined) where.isAgreementJob = filters.isAgreementJob;
    if (filters.dateFrom || filters.dateTo) {
      where.scheduledStart = {};
      if (filters.dateFrom) where.scheduledStart.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.scheduledStart.lte = new Date(filters.dateTo);
    }
    if (filters.search) {
      where.OR = [
        { jobNumber: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
        { customerName: { contains: filters.search, mode: 'insensitive' } },
        { serviceAddress: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ scheduledStart: 'asc' }, { createdAt: 'desc' }],
        include: {
          jobType: { select: { id: true, name: true, slug: true, color: true, icon: true } },
          _count: { select: { workOrders: true, photos: true } },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================================
  // GET ONE (full detail)
  // ============================================================

  async findOne(companyId: string, id: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, companyId },
      include: {
        jobType: true,
        template: { include: { tasks: { orderBy: { taskOrder: 'asc' } } } },
        customFieldValues: {
          include: { fieldDef: true },
          orderBy: { fieldDef: { sortOrder: 'asc' } },
        },
        workOrders: {
          include: {
            lineItems: true,
            taskCompletions: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        photos: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  // ============================================================
  // DELETE
  // ============================================================

  async remove(companyId: string, id: string) {
    const existing = await this.prisma.job.findFirst({
      where: { id, companyId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException(`Job ${id} not found`);

    // WorkOrder relation does not cascade on delete in this schema.
    await this.prisma.$transaction(async (tx) => {
      await tx.workOrder.deleteMany({ where: { jobId: id } });
      await tx.job.delete({ where: { id } });
    });

    await this.invalidateStatsCache(companyId);
    return { success: true, id };
  }

  // ============================================================
  // STATUS TRANSITION (state machine)
  // ============================================================

  async updateStatus(
    companyId: string,
    jobId: string,
    user: AuthUser,
    dto: UpdateJobStatusDto,
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: {
        id: true, status: true, customerId: true,
        customerName: true, customerEmail: true,
        serviceAddress: true, assignedToName: true, scheduledStart: true,
        agreementId: true,
      },
    });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    const currentStatus = job.status as JobStatusDto;
    const newStatus = dto.status;

    // Guard: validate the transition is allowed
    const allowed = STATUS_TRANSITIONS[currentStatus];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition job from ${currentStatus} to ${newStatus}. ` +
        `Allowed: [${allowed.join(', ')}]`,
      );
    }

    const now = new Date();
    const extraData: Record<string, unknown> = {};
    if (newStatus === JobStatusDto.ON_SITE) extraData.actualStart = now;
    if (newStatus === JobStatusDto.COMPLETED) extraData.actualEnd = now;
    if (newStatus === JobStatusDto.COMPLETED) extraData.completedAt = now;
    if (newStatus === JobStatusDto.CANCELLED && dto.cancellationReason) {
      extraData.cancellationReason = dto.cancellationReason;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.job.update({
        where: { id: jobId },
        data: { status: newStatus as any, ...extraData },
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId,
          fromStatus: currentStatus as any,
          toStatus: newStatus as any,
          changedById: user.userId,
          changedByName: user.name ?? user.email,
          note: dto.note,
        },
      });

      return result;
    });

    await this.invalidateStatsCache(companyId);

    if (newStatus === JobStatusDto.EN_ROUTE) {
      const commsBase = process.env.COMMS_SERVICE_URL || 'http://localhost:3005';
      const payload = {
        companyId,
        jobId,
        jobStatus: newStatus,
        customerId: job.customerId,
        customerName: job.customerName,
        customerEmail: job.customerEmail ?? undefined,
        jobAddress: job.serviceAddress,
        technicianName: job.assignedToName ?? undefined,
        scheduledAt: job.scheduledStart?.toISOString() ?? undefined,
      };
      axios.post(`${commsBase}/automation/events/job-status-changed`, payload).catch((err: unknown) => {
        this.logger.warn(`Failed to notify comms-service of EN_ROUTE: ${err instanceof Error ? err.message : String(err)}`);
      });
    }

    // Agreement jobs: completing a visit advances the agreement's service
    // schedule in crm-service (lastServiceDate, visitsUsed, nextServiceDate).
    if (newStatus === JobStatusDto.COMPLETED && job.agreementId) {
      const crmBase = process.env.CRM_SERVICE_URL || 'http://localhost:3001';
      const headers: Record<string, string> =
        process.env.BYPASS_AUTH === 'true'
          ? {
              'x-test-user-role': 'super_admin',
              'x-test-company-id': companyId,
              'x-test-user-id': 'job-service',
              'x-test-user-email': 'jobs@tscrm.internal',
              'x-test-user-name': 'Job Service',
            }
          : { Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}` };
      axios
        .post(`${crmBase}/agreements/${job.agreementId}/record-visit`, { jobId }, { headers, timeout: 8_000 })
        .catch((err: unknown) => {
          this.logger.warn(
            `Failed to record agreement visit for ${job.agreementId}: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
    }

    return updated;
  }

  // ============================================================
  // PATCH FIELDS  (used by combined PATCH /jobs/:id endpoint)
  // Accepts extra non-schema fields like gpsTrackingEnabled/completedAt
  // gracefully (they are silently ignored if not in DB schema).
  // ============================================================

  async patchFields(
    companyId: string,
    id: string,
    data: Partial<{
      title: string;
      description: string;
      priority: string;
      assignedToId: string;
      assignedToName: string;
      scheduledStart: string;
      scheduledEnd: string;
      notes: string;
      internalNotes: string;
      tags: string[];
      gpsTrackingEnabled?: boolean;  // no DB column — ignored
      completedAt?: string;
      hasPartShortage?: boolean;
      partShortageNote?: string;
    }>,
  ) {
    await this.findOne(companyId, id);
    // Strip fields that don't exist on the Prisma Job model
    const { gpsTrackingEnabled: _gps, ...rest } = data;
    return this.prisma.job.update({
      where: { id },
      data: {
        ...rest,
        priority: rest.priority as any,
        scheduledStart: rest.scheduledStart ? new Date(rest.scheduledStart) : undefined,
        scheduledEnd: rest.scheduledEnd ? new Date(rest.scheduledEnd) : undefined,
        completedAt: rest.completedAt ? new Date(rest.completedAt) : undefined,
      },
    });
  }

  // ============================================================
  // UPDATE (general fields — not status)
  // ============================================================

  async update(
    companyId: string,
    id: string,
    data: Partial<{
      title: string;
      description: string;
      priority: string;
      assignedToId: string;
      assignedToName: string;
      scheduledStart: string;
      scheduledEnd: string;
      notes: string;
      internalNotes: string;
      tags: string[];
      projectId: string | null;
      houseId: string | null;
      equipmentId: string | null;
    }>,
  ) {
    await this.findOne(companyId, id);
    const updated = await this.prisma.job.update({
      where: { id },
      data: {
        ...data,
        priority: data.priority as any,
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : undefined,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
      },
    });
    // Generic PATCH can change status/scheduledStart (the admin UI's status
    // dropdown goes through here) — the cached stat counts must not lag it.
    await this.invalidateStatsCache(companyId);
    return updated;
  }

  // ============================================================
  // CUSTOM FIELD VALUES — update on existing job
  // ============================================================

  async updateCustomFields(
    companyId: string,
    jobId: string,
    fields: Array<{ fieldDefId: string; value: unknown }>,
  ) {
    await this.findOne(companyId, jobId);
    await this.prisma.$transaction(
      fields.map((f) =>
        this.prisma.jobCustomFieldValue.upsert({
          where: { jobId_fieldDefId: { jobId, fieldDefId: f.fieldDefId } },
          update: { value: f.value as any },
          create: { jobId, fieldDefId: f.fieldDefId, value: f.value as any },
        }),
      ),
    );
    return this.findOne(companyId, jobId);
  }

  // ============================================================
  // DASHBOARD STATS
  // ============================================================

  async getStats(companyId: string) {
    const cacheKey = `jobs:stats:${companyId}`;
    const cached = await this.cache.get<{ byStatus: unknown[]; scheduledToday: number }>(cacheKey);
    if (cached) return cached;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // One GROUP BY for all status counts + one count for today's schedule —
    // this used to be 10 separate COUNT queries per request.
    const [grouped, scheduledToday] = await Promise.all([
      this.prisma.job.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { _all: true },
      }),
      this.prisma.job.count({
        where: {
          companyId,
          status: { in: ['SCHEDULED', 'EN_ROUTE', 'ON_SITE'] as any },
          scheduledStart: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    const countByStatus = new Map(grouped.map((g) => [g.status as string, g._count._all]));
    const statuses = [
      'PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE',
      'COMPLETED', 'INVOICED', 'PAID', 'CANCELLED', 'ON_HOLD',
    ];
    const result = {
      byStatus: statuses.map((status) => ({ status, count: countByStatus.get(status) ?? 0 })),
      scheduledToday,
    };
    await this.cache.set(cacheKey, result, STATS_CACHE_TTL_S);
    return result;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async invalidateStatsCache(companyId: string) {
    await this.cache.del(`jobs:stats:${companyId}`);
  }

  private async generateJobNumber(
    tx: Prisma.TransactionClient,
    companyId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const [row] = await tx.$queryRaw<Array<{ maxNumber: number | bigint | null }>>`
      SELECT COALESCE(MAX(SUBSTRING("jobNumber" FROM ${`^JOB-${year}-([0-9]+)$`})::int), 0) AS "maxNumber"
      FROM "jobs"."jobs"
      WHERE "companyId" = ${companyId}
        AND "jobNumber" ~ ${`^JOB-${year}-[0-9]+$`}
    `;
    const maxNumber = Number(row?.maxNumber ?? 0);

    return `JOB-${year}-${String(maxNumber + 1).padStart(4, '0')}`;
  }

  private isJobNumberUniqueError(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      return false;
    }

    const target = error.meta?.target;
    return Array.isArray(target)
      && target.includes('companyId')
      && target.includes('jobNumber');
  }
}
