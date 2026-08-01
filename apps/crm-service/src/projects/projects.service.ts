/**
 * ProjectsService — long-running customer engagements with a day-adjustable
 * technician crew (spec: docs/superpowers/specs/2026-07-04-projects-module-design.md).
 *
 * The roster rule lives in roster.util.ts (pure). Roster override rows are
 * stored ONLY for dates that differ from the default; techUserIds is the
 * complete effective crew for that date.
 */
import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { clampPagination } from '@tscrm/types';
import {
  effectiveRoster, toDateStr, isValidDateStr, WEEKDAYS,
} from './roster.util';
import { isValidTemplateType, PROJECT_TEMPLATES } from './project-templates';

const PROJECT_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

export interface UpsertProjectInput {
  customerId?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
  status?: string;
  templateType?: string;
  startDate?: string | null;
  targetEndDate?: string | null;
  budget?: number | null;
  requiredHeadcount?: number | null;
  siteAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  workingDays?: string[];
  baseTeamUserIds?: string[];
  notes?: string | null;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async list(companyId: string, filters: {
    status?: string; customerId?: string; search?: string; page?: number; limit?: number;
  }) {
    const { page, limit } = clampPagination({ page: filters.page, limit: filters.limit });
    const where: any = { companyId };
    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { siteAddress: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);
    return { data: await this.decorate(companyId, data), total, page, limit };
  }

  async findOne(companyId: string, id: string) {
    const project = await this.prisma.project.findFirst({ where: { id, companyId } });
    if (!project) throw new NotFoundException('Project not found');
    const [decorated] = await this.decorate(companyId, [project]);
    const agreements = await this.prisma.serviceAgreement.findMany({
      where: { companyId, projectId: id },
      select: {
        id: true, name: true, serviceType: true, serviceInterval: true,
        nextServiceDate: true, status: true, houseId: true,
      },
    });
    // Housing Scheme: rolled-up open-issue count across all houses (Houses tab badge).
    const openIssueCount = project.templateType === 'HOUSING_SCHEME'
      ? await this.prisma.houseIssueReport.count({
          where: { companyId, status: { not: 'RESOLVED' }, house: { projectId: id } },
        })
      : 0;
    return { ...decorated, agreements, openIssueCount };
  }

  async create(companyId: string, input: UpsertProjectInput) {
    if (!input.name?.trim()) throw new BadRequestException('name is required');
    this.validateStatus(input.status);
    this.validateWorkingDays(input.workingDays);
    if (input.templateType !== undefined && !isValidTemplateType(input.templateType)) {
      throw new BadRequestException(`templateType must be one of ${PROJECT_TEMPLATES.join(', ')}`);
    }

    if (input.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: input.customerId, companyId },
        select: { id: true },
      });
      if (!customer) throw new BadRequestException('Customer not found in this company');
    }

    return this.prisma.project.create({
      data: {
        companyId,
        customerId: input.customerId ?? null,
        name: input.name.trim(),
        description: input.description ?? null,
        category: input.category ?? null,
        templateType: input.templateType ?? 'STANDARD',
        status: input.status ?? 'PLANNING',
        startDate: input.startDate ? new Date(input.startDate) : null,
        targetEndDate: input.targetEndDate ? new Date(input.targetEndDate) : null,
        budget: input.budget ?? null,
        requiredHeadcount: input.requiredHeadcount ?? null,
        siteAddress: input.siteAddress ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        workingDays: input.workingDays ?? undefined,
        baseTeamUserIds: input.baseTeamUserIds ?? [],
        notes: input.notes ?? null,
      },
    });
  }

  async update(companyId: string, id: string, input: UpsertProjectInput) {
    await this.assertExists(companyId, id);
    this.validateStatus(input.status);
    this.validateWorkingDays(input.workingDays);

    if (input.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: input.customerId, companyId },
        select: { id: true },
      });
      if (!customer) throw new BadRequestException('Customer not found in this company');
    }

    const data: any = {};
    for (const key of [
      'customerId', 'name', 'description', 'category', 'status', 'budget', 'requiredHeadcount',
      'siteAddress', 'latitude', 'longitude', 'workingDays', 'baseTeamUserIds', 'notes',
    ] as const) {
      if (input[key] !== undefined) data[key] = input[key];
    }
    if (input.startDate !== undefined) data.startDate = input.startDate ? new Date(input.startDate) : null;
    if (input.targetEndDate !== undefined) data.targetEndDate = input.targetEndDate ? new Date(input.targetEndDate) : null;
    if (typeof data.name === 'string') data.name = data.name.trim();

    return this.prisma.project.update({ where: { id }, data });
  }

  /** Soft delete → CANCELLED (frees all rosters via the status gate). */
  async remove(companyId: string, id: string) {
    await this.assertExists(companyId, id);
    await this.prisma.project.update({ where: { id }, data: { status: 'CANCELLED' } });
    return { success: true };
  }

  // ── Roster ────────────────────────────────────────────────────────────────

  /** Per-date effective roster for a range (inclusive). Max 92 days. */
  async rosterRange(companyId: string, id: string, from: string, to: string) {
    if (!isValidDateStr(from) || !isValidDateStr(to)) {
      throw new BadRequestException('from/to must be YYYY-MM-DD');
    }
    if (to < from) throw new BadRequestException('to must be >= from');
    const project = await this.prisma.project.findFirst({ where: { id, companyId } });
    if (!project) throw new NotFoundException('Project not found');

    const overrides = await this.prisma.projectRosterDay.findMany({
      where: { projectId: id, date: { gte: new Date(`${from}T00:00:00Z`), lte: new Date(`${to}T00:00:00Z`) } },
    });
    const byDate = new Map(overrides.map((o) => [toDateStr(o.date), o]));

    const days: { date: string; techUserIds: string[]; isOverride: boolean; isOff: boolean }[] = [];
    const cursor = new Date(`${from}T00:00:00Z`);
    const end = new Date(`${to}T00:00:00Z`);
    let guard = 0;
    while (cursor <= end && guard < 92) {
      const dateStr = toDateStr(cursor);
      const override = byDate.get(dateStr);
      days.push({
        date: dateStr,
        techUserIds: effectiveRoster(project, dateStr, override ?? null),
        isOverride: !!override,
        isOff: override?.isOff ?? false,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      guard++;
    }
    return days;
  }

  /**
   * Set the roster for one date: override crew / mark day off / reset to default.
   * Past dates are read-only.
   */
  async setRosterDay(
    companyId: string,
    id: string,
    date: string,
    body: { techUserIds?: string[]; isOff?: boolean; reset?: boolean },
    updatedBy?: string,
  ) {
    if (!isValidDateStr(date)) throw new BadRequestException('date must be YYYY-MM-DD');
    const today = toDateStr(new Date());
    if (date < today) throw new BadRequestException('Past roster days are read-only');
    const project = await this.prisma.project.findFirst({ where: { id, companyId } });
    if (!project) throw new NotFoundException('Project not found');

    if (body.reset) {
      await this.prisma.projectRosterDay.deleteMany({
        where: { projectId: id, date: new Date(`${date}T00:00:00Z`) },
      });
    } else {
      const isOff = body.isOff === true;
      const techUserIds = isOff ? [] : (body.techUserIds ?? []);
      await this.prisma.projectRosterDay.upsert({
        where: { projectId_date: { projectId: id, date: new Date(`${date}T00:00:00Z`) } },
        create: {
          companyId, projectId: id, date: new Date(`${date}T00:00:00Z`),
          techUserIds, isOff, updatedBy: updatedBy ?? null,
        },
        update: { techUserIds, isOff, updatedBy: updatedBy ?? null },
      });
    }

    const [day] = await this.rosterRange(companyId, id, date, date);
    return day;
  }

  /** All projects with a non-empty effective roster on a date (Day Planner band). */
  async rostersByDate(companyId: string, date: string) {
    if (!isValidDateStr(date)) throw new BadRequestException('date must be YYYY-MM-DD');
    const projects = await this.prisma.project.findMany({
      where: { companyId, status: 'ACTIVE' },
    });
    if (projects.length === 0) return [];

    const overrides = await this.prisma.projectRosterDay.findMany({
      where: { companyId, date: new Date(`${date}T00:00:00Z`), projectId: { in: projects.map((p) => p.id) } },
    });
    const byProject = new Map(overrides.map((o) => [o.projectId, o]));

    return projects
      .map((p) => {
        const override = byProject.get(p.id);
        const techUserIds = effectiveRoster(p, date, override ?? null);
        return {
          projectId: p.id,
          name: p.name,
          customerId: p.customerId,
          siteAddress: p.siteAddress,
          latitude: p.latitude,
          longitude: p.longitude,
          requiredHeadcount: p.requiredHeadcount,
          techUserIds,
          isOverride: !!override,
          isOff: override?.isOff ?? false,
        };
      })
      .filter((r) => r.techUserIds.length > 0 || r.isOff);
  }

  // ── Portal ────────────────────────────────────────────────────────────────

  /** Customer-scoped list for the portal (role=CUSTOMER). */
  async mine(companyId: string, customerId: string) {
    const projects = await this.prisma.project.findMany({
      where: { companyId, customerId, status: { not: 'CANCELLED' } },
      orderBy: { updatedAt: 'desc' },
    });
    return this.decorate(companyId, projects);
  }

  // ── Agreement links ───────────────────────────────────────────────────────

  async linkAgreement(companyId: string, id: string, agreementId: string) {
    await this.assertExists(companyId, id);
    const agreement = await this.prisma.serviceAgreement.findFirst({
      where: { id: agreementId, companyId },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    await this.prisma.serviceAgreement.update({ where: { id: agreementId }, data: { projectId: id } });
    return { success: true };
  }

  async unlinkAgreement(companyId: string, id: string, agreementId: string) {
    await this.assertExists(companyId, id);
    await this.prisma.serviceAgreement.updateMany({
      where: { id: agreementId, companyId, projectId: id },
      data: { projectId: null },
    });
    return { success: true };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async assertExists(companyId: string, id: string) {
    const found = await this.prisma.project.findFirst({ where: { id, companyId }, select: { id: true } });
    if (!found) throw new NotFoundException('Project not found');
  }

  private validateStatus(status?: string) {
    if (status !== undefined && !PROJECT_STATUSES.includes(status)) {
      throw new BadRequestException(`status must be one of ${PROJECT_STATUSES.join(', ')}`);
    }
  }

  private validateWorkingDays(days?: string[]) {
    if (days === undefined) return;
    if (!Array.isArray(days) || days.some((d) => !(WEEKDAYS as readonly string[]).includes(d))) {
      throw new BadRequestException('workingDays must be a subset of SUN..SAT');
    }
  }

  /** Attach customerName so lists render without extra round-trips. */
  private async decorate(companyId: string, projects: any[]) {
    if (projects.length === 0) return [];
    const customerIds = [...new Set(projects.map((p) => p.customerId).filter(Boolean))] as string[];
    const customers = customerIds.length
      ? await this.prisma.customer.findMany({
          where: { companyId, id: { in: customerIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const names = new Map(customers.map((c) => [c.id, `${c.firstName} ${c.lastName}`.trim()]));
    return projects.map((p) => ({ ...p, customerName: p.customerId ? (names.get(p.customerId) ?? '—') : null }));
  }
}
