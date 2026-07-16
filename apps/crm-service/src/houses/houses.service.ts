/**
 * HousesService — the "houses" sub-entity for Housing Scheme template projects.
 * Spec: docs/superpowers/specs/2026-07-13-project-templates-housing-scheme-design.md
 *
 * House.ownerCustomerId is authoritative for ownership. Equipment.customerId is a
 * denormalized mirror, resynced here whenever a house's owner changes (via
 * EquipmentService.resyncHouseEquipmentOwner) so the portal's existing "My Equipment"
 * query (by customerId) never shows equipment to the wrong owner.
 */
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentService } from '../equipment/equipment.service';
import { AuthService } from '../auth/auth.service';

const ISSUE_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'];

export interface UpsertHouseInput {
  label?: string;
  address?: string | null;
  tags?: string[];
  notes?: string | null;
}

@Injectable()
export class HousesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly equipment: EquipmentService,
    private readonly auth: AuthService,
  ) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async listForProject(companyId: string, projectId: string) {
    await this.assertProjectIsHousingScheme(companyId, projectId);
    const houses = await this.prisma.house.findMany({
      where: { companyId, projectId },
      orderBy: { createdAt: 'asc' },
    });
    return this.decorate(companyId, houses);
  }

  async create(companyId: string, projectId: string, input: UpsertHouseInput) {
    await this.assertProjectIsHousingScheme(companyId, projectId);
    if (!input.label?.trim()) throw new BadRequestException('label is required');

    const house = await this.prisma.house.create({
      data: {
        companyId,
        projectId,
        label: input.label.trim(),
        address: input.address ?? null,
        tags: input.tags ?? [],
        notes: input.notes ?? null,
      },
    });
    const [decorated] = await this.decorate(companyId, [house]);
    return decorated;
  }

  async findOne(companyId: string, id: string) {
    const house = await this.getOrThrow(companyId, id);
    const [decorated] = await this.decorate(companyId, [house]);
    return decorated;
  }

  async update(companyId: string, id: string, input: UpsertHouseInput) {
    await this.getOrThrow(companyId, id);
    const data: any = {};
    if (input.label !== undefined) {
      if (!input.label.trim()) throw new BadRequestException('label cannot be empty');
      data.label = input.label.trim();
    }
    if (input.address !== undefined) data.address = input.address;
    if (input.tags !== undefined) data.tags = input.tags;
    if (input.notes !== undefined) data.notes = input.notes;

    const house = await this.prisma.house.update({ where: { id }, data });
    const [decorated] = await this.decorate(companyId, [house]);
    return decorated;
  }

  async remove(companyId: string, id: string) {
    await this.getOrThrow(companyId, id);
    await this.prisma.house.delete({ where: { id } });
    return { success: true };
  }

  // ── Ownership ─────────────────────────────────────────────────────────────

  /**
   * Assign (or clear, with customerId=null) a house's owner. One current owner at a
   * time — no ownership history in v1. Resyncs Equipment.customerId for every piece
   * of equipment already on the house so the portal keeps showing the right owner.
   */
  async assignOwner(companyId: string, id: string, customerId: string | null) {
    const house = await this.getOrThrow(companyId, id);

    if (customerId) {
      const customer = await this.prisma.customer.findFirst({ where: { id: customerId, companyId } });
      if (!customer) throw new BadRequestException('Customer not found in this company');
    }

    const updated = await this.prisma.house.update({
      where: { id },
      data: { ownerCustomerId: customerId },
    });

    if (customerId && customerId !== house.ownerCustomerId) {
      await this.equipment.resyncHouseEquipmentOwner(companyId, id, customerId);
    }

    const [decorated] = await this.decorate(companyId, [updated]);
    return decorated;
  }

  async generateOwnerAccount(companyId: string, id: string) {
    const house = await this.getOrThrow(companyId, id);
    if (!house.ownerCustomerId) throw new BadRequestException('Assign an owner to this house first');
    return this.auth.provisionHouseOwnerAccount(companyId, house.ownerCustomerId);
  }

  // ── Portal ────────────────────────────────────────────────────────────────

  /** Customer-scoped houses for the portal (role=CUSTOMER). Usually 0 or 1, but a
   *  customer could own more than one house across schemes. */
  async mine(companyId: string, customerId: string) {
    const houses = await this.prisma.house.findMany({
      where: { companyId, ownerCustomerId: customerId },
      orderBy: { createdAt: 'desc' },
    });
    if (houses.length === 0) return [];
    const projectIds = [...new Set(houses.map((h) => h.projectId))];
    const projects = await this.prisma.project.findMany({
      where: { companyId, id: { in: projectIds } },
      select: { id: true, name: true },
    });
    const names = new Map(projects.map((p) => [p.id, p.name]));
    return houses.map((h) => ({ ...h, projectName: names.get(h.projectId) ?? '—' }));
  }

  private async assertOwnsHouse(companyId: string, houseId: string, customerId: string) {
    const house = await this.prisma.house.findFirst({ where: { id: houseId, companyId } });
    if (!house) throw new NotFoundException('House not found');
    if (house.ownerCustomerId !== customerId) throw new ForbiddenException('You can only view your own house');
    return house;
  }

  // ── Issue reports ─────────────────────────────────────────────────────────

  async listIssuesForHouse(companyId: string, houseId: string) {
    await this.getOrThrow(companyId, houseId);
    return this.prisma.houseIssueReport.findMany({
      where: { companyId, houseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listMyIssues(companyId: string, customerId: string) {
    return this.prisma.houseIssueReport.findMany({
      where: { companyId, reportedByCustomerId: customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Portal: house owner reports an error code on their thermostat (or any equipment). */
  async createIssue(
    companyId: string,
    customerId: string,
    houseId: string,
    input: { equipmentId?: string; errorCode?: string; description?: string },
  ) {
    await this.assertOwnsHouse(companyId, houseId, customerId);
    if (input.equipmentId) {
      const eq = await this.prisma.equipment.findFirst({
        where: { id: input.equipmentId, companyId, houseId },
      });
      if (!eq) throw new BadRequestException('Equipment not found on this house');
    }
    if (!input.errorCode?.trim() && !input.description?.trim()) {
      throw new BadRequestException('Provide an error code or a description');
    }
    return this.prisma.houseIssueReport.create({
      data: {
        companyId,
        houseId,
        equipmentId: input.equipmentId ?? null,
        reportedByCustomerId: customerId,
        errorCode: input.errorCode?.trim() || null,
        description: input.description?.trim() || null,
        status: 'OPEN',
      },
    });
  }

  /** Staff: acknowledge/resolve a report. */
  async updateIssueStatus(
    companyId: string,
    issueId: string,
    input: { status: string; resolvedNote?: string },
  ) {
    if (!ISSUE_STATUSES.includes(input.status)) {
      throw new BadRequestException(`status must be one of ${ISSUE_STATUSES.join(', ')}`);
    }
    const issue = await this.prisma.houseIssueReport.findFirst({ where: { id: issueId, companyId } });
    if (!issue) throw new NotFoundException('Issue report not found');
    return this.prisma.houseIssueReport.update({
      where: { id: issueId },
      data: { status: input.status, resolvedNote: input.resolvedNote ?? issue.resolvedNote },
    });
  }

  /** Rolled-up open-issue count across every house on a project (Project detail badge). */
  async openIssueCountForProject(companyId: string, projectId: string) {
    return this.prisma.houseIssueReport.count({
      where: { companyId, status: { not: 'RESOLVED' }, house: { projectId } },
    });
  }

  /**
   * Every open/acknowledged issue report across the whole company, with enough
   * context (house, project, reporter) to render a real alert — not just a count —
   * on the admin Dashboard and anywhere else that needs to surface these.
   */
  async openIssuesForCompany(companyId: string) {
    const issues = await this.prisma.houseIssueReport.findMany({
      where: { companyId, status: { not: 'RESOLVED' } },
      orderBy: { createdAt: 'desc' },
      include: { house: { include: { project: { select: { id: true, name: true } } } } },
    });
    if (issues.length === 0) return [];

    const reporterIds = [...new Set(issues.map((i) => i.reportedByCustomerId))];
    const reporters = await this.prisma.customer.findMany({
      where: { companyId, id: { in: reporterIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const reporterName = new Map(reporters.map((r) => [r.id, `${r.firstName} ${r.lastName}`.trim()]));

    return issues.map((i) => ({
      id: i.id,
      houseId: i.houseId,
      houseLabel: i.house.label,
      projectId: i.house.project.id,
      projectName: i.house.project.name,
      equipmentId: i.equipmentId,
      errorCode: i.errorCode,
      description: i.description,
      status: i.status,
      reportedByName: reporterName.get(i.reportedByCustomerId) ?? '—',
      createdAt: i.createdAt,
    }));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async getOrThrow(companyId: string, id: string) {
    const house = await this.prisma.house.findFirst({ where: { id, companyId } });
    if (!house) throw new NotFoundException('House not found');
    return house;
  }

  /** Used by controller-level ownership checks for customer-facing equipment endpoints. */
  async getOwnerCustomerId(companyId: string, id: string): Promise<string | null> {
    const house = await this.getOrThrow(companyId, id);
    return house.ownerCustomerId;
  }

  private async assertProjectIsHousingScheme(companyId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, companyId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.templateType !== 'HOUSING_SCHEME') {
      throw new BadRequestException('Houses can only be added to a Housing Scheme project');
    }
    return project;
  }

  /** Attach ownerName + account status so lists render without extra round-trips. */
  private async decorate(companyId: string, houses: any[]) {
    if (houses.length === 0) return [];
    const ownerIds = [...new Set(houses.map((h) => h.ownerCustomerId).filter(Boolean))] as string[];
    const owners = ownerIds.length
      ? await this.prisma.customer.findMany({
          where: { companyId, id: { in: ownerIds } },
          select: { id: true, firstName: true, lastName: true, email: true, auth0UserId: true },
        })
      : [];
    const ownerById = new Map(owners.map((o) => [o.id, o]));

    const userIds = owners.map((o) => o.auth0UserId).filter(Boolean) as string[];
    const users = userIds.length
      ? await this.prisma.companyUser.findMany({
          where: { companyId, id: { in: userIds } },
          select: { id: true, mustResetPassword: true, lastLoginAt: true, isActive: true },
        })
      : [];
    const userById = new Map(users.map((u) => [u.id, u]));

    // Batched per-house counts (not N+1) — every house-list view (project Houses
    // tab, project cards) needs these to render its "open issue" alert treatment.
    const houseIds = houses.map((h) => h.id);
    const [equipmentCounts, issueCounts] = await Promise.all([
      this.prisma.equipment.groupBy({
        by: ['houseId'], where: { companyId, houseId: { in: houseIds } }, _count: { _all: true },
      }),
      this.prisma.houseIssueReport.groupBy({
        by: ['houseId'], where: { companyId, houseId: { in: houseIds }, status: { not: 'RESOLVED' } }, _count: { _all: true },
      }),
    ]);
    const equipmentCountByHouse = new Map(equipmentCounts.map((c) => [c.houseId, c._count._all]));
    const issueCountByHouse = new Map(issueCounts.map((c) => [c.houseId, c._count._all]));

    return houses.map((h) => {
      const owner = h.ownerCustomerId ? ownerById.get(h.ownerCustomerId) : undefined;
      const user = owner?.auth0UserId ? userById.get(owner.auth0UserId) : undefined;

      let accountStatus: 'NO_OWNER' | 'NO_ACCOUNT' | 'INVITED' | 'ACTIVE' = 'NO_OWNER';
      if (owner) {
        if (!user || !user.isActive) accountStatus = 'NO_ACCOUNT';
        else if (user.lastLoginAt) accountStatus = 'ACTIVE';
        else if (user.mustResetPassword) accountStatus = 'INVITED';
        else accountStatus = 'ACTIVE';
      }

      return {
        ...h,
        ownerName: owner ? `${owner.firstName} ${owner.lastName}`.trim() : null,
        ownerEmail: owner?.email ?? null,
        accountStatus,
        equipmentCount: equipmentCountByHouse.get(h.id) ?? 0,
        openIssueCount: issueCountByHouse.get(h.id) ?? 0,
      };
    });
  }
}
