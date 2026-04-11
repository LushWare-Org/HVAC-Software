import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../redis-cache.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto, JobStatusDto, STATUS_TRANSITIONS } from './dto/update-job-status.dto';
import { AuthUser, PaginatedResponse } from '@tscrm/types';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private cache: RedisCacheService,
  ) {}

  // ============================================================
  // CREATE
  // ============================================================

  async create(user: AuthUser, dto: CreateJobDto) {
    const jobNumber = await this.generateJobNumber(user.companyId);
    const { customFields, ...rest } = dto;

    const job = await this.prisma.job.create({
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

    // Save custom field values if provided
    if (customFields?.length) {
      await this.prisma.$transaction(
        customFields.map((cf) =>
          this.prisma.jobCustomFieldValue.upsert({
            where: { jobId_fieldDefId: { jobId: job.id, fieldDefId: cf.fieldDefId } },
            update: { value: cf.value as any },
            create: { jobId: job.id, fieldDefId: cf.fieldDefId, value: cf.value as any },
          }),
        ),
      );
    }

    await this.cache.del(`jobs:stats:${user.companyId}`);
    return this.findOne(user.companyId, job.id);
  }

  // ============================================================
  // LIST (paginated, filterable)
  // ============================================================

  async findAll(
    companyId: string,
    page = 1,
    limit = 20,
    filters: {
      status?: string;
      assignedToId?: string;
      jobTypeId?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      customerId?: string;
    } = {},
  ): Promise<PaginatedResponse<unknown>> {
    const skip = (page - 1) * limit;
    const where: any = { companyId };

    if (filters.status) where.status = filters.status;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.jobTypeId) where.jobTypeId = filters.jobTypeId;
    if (filters.customerId) where.customerId = filters.customerId;
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
      select: { id: true, status: true },
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

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.job.update({
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

      await this.cache.del(`jobs:stats:${companyId}`);
      return updated;
    });
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
    }>,
  ) {
    await this.findOne(companyId, id);
    return this.prisma.job.update({
      where: { id },
      data: {
        ...data,
        priority: data.priority as any,
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : undefined,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
      },
    });
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
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const statuses = [
      'PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE',
      'COMPLETED', 'INVOICED', 'PAID', 'CANCELLED', 'ON_HOLD',
    ];
    const counts = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await this.prisma.job.count({
          where: { companyId, status: status as any },
        }),
      })),
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const scheduledToday = await this.prisma.job.count({
      where: {
        companyId,
        status: { in: ['SCHEDULED', 'EN_ROUTE', 'ON_SITE'] as any },
        scheduledStart: { gte: today, lt: tomorrow },
      },
    });

    const result = { byStatus: counts, scheduledToday };
    await this.cache.set(cacheKey, result, 30); // 30-second cache
    return result;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async generateJobNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.job.count({
      where: { companyId, jobNumber: { startsWith: `JOB-${year}-` } },
    });
    return `JOB-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
