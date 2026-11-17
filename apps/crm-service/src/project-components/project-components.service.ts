/**
 * ProjectComponentsService — the generic "components" sub-entity for any
 * templated project (replaces HousesService). Spec:
 * docs/superpowers/specs/2026-08-14-project-component-templates-design.md
 *
 * ProjectComponent.ownerCustomerId is authoritative for ownership. Equipment.customerId
 * is a denormalized mirror, resynced here whenever a component's owner changes (via
 * EquipmentService.resyncComponentEquipmentOwner) so the portal's existing "My Equipment"
 * query (by customerId) never shows equipment to the wrong owner.
 */
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentService } from '../equipment/equipment.service';
import { AuthService } from '../auth/auth.service';

const ISSUE_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'];

function slugify(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export interface UpsertComponentInput {
  typeLabel?: string;
  typeAssignable?: boolean;
  label?: string;
  tags?: string[];
  notes?: string | null;
  ownerCustomerId?: string;
}

@Injectable()
export class ProjectComponentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly equipment: EquipmentService,
    private readonly auth: AuthService,
  ) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async listForProject(companyId: string, projectId: string) {
    await this.getProjectOrThrow(companyId, projectId);
    const components = await this.prisma.projectComponent.findMany({
      where: { companyId, projectId },
      orderBy: { createdAt: 'asc' },
      take: 1000,
    });
    return this.decorate(companyId, components);
  }

  async create(companyId: string, projectId: string, input: UpsertComponentInput & { typeLabel: string; label: string }) {
    const project = await this.getProjectOrThrow(companyId, projectId);
    if (!input.label?.trim()) throw new BadRequestException('label is required');
    if (!input.typeLabel?.trim()) throw new BadRequestException('typeLabel is required');

    const componentType = await this.resolveOrRegisterType(project, input.typeLabel, input.typeAssignable);

    if (input.ownerCustomerId) {
      this.assertOwnerAllowed(project, componentType);
      const customer = await this.prisma.customer.findFirst({ where: { id: input.ownerCustomerId, companyId } });
      if (!customer) throw new BadRequestException('Customer not found in this company');
    }

    const component = await this.prisma.projectComponent.create({
      data: {
        companyId,
        projectId,
        componentTypeKey: componentType.key,
        label: input.label.trim(),
        tags: input.tags ?? [],
        notes: input.notes ?? null,
        ownerCustomerId: input.ownerCustomerId ?? null,
      },
    });
    const [decorated] = await this.decorate(companyId, [component]);
    return decorated;
  }

  async findOne(companyId: string, id: string) {
    const component = await this.getOrThrow(companyId, id);
    const [decorated] = await this.decorate(companyId, [component]);
    return decorated;
  }

  async update(companyId: string, id: string, input: UpsertComponentInput) {
    await this.getOrThrow(companyId, id);
    const data: any = {};
    if (input.label !== undefined) {
      if (!input.label.trim()) throw new BadRequestException('label cannot be empty');
      data.label = input.label.trim();
    }
    if (input.tags !== undefined) data.tags = input.tags;
    if (input.notes !== undefined) data.notes = input.notes;

    const component = await this.prisma.projectComponent.update({ where: { id }, data });
    const [decorated] = await this.decorate(companyId, [component]);
    return decorated;
  }

  async remove(companyId: string, id: string) {
    await this.getOrThrow(companyId, id);
    await this.prisma.projectComponent.delete({ where: { id } });
    return { success: true };
  }

  // ── Ownership ─────────────────────────────────────────────────────────────

  /**
   * Assign (or clear, with customerId=null) a component's owner. One current owner
   * at a time — no ownership history in v1. Resyncs Equipment.customerId for every
   * piece of equipment already on the component so the portal keeps showing the
   * right owner. When setting a non-null owner, the two-tier assignability check
   * (template eligibility + this project's own setting) is enforced.
   */
  async assignOwner(companyId: string, id: string, customerId: string | null) {
    const component = await this.getOrThrow(companyId, id);

    if (customerId) {
      const project = await this.getProjectOrThrow(companyId, component.projectId);
      const componentType = this.findTypeByKey(project, component.componentTypeKey);
      this.assertOwnerAllowed(project, componentType);
      const customer = await this.prisma.customer.findFirst({ where: { id: customerId, companyId } });
      if (!customer) throw new BadRequestException('Customer not found in this company');
    }

    const updated = await this.prisma.projectComponent.update({
      where: { id },
      data: { ownerCustomerId: customerId },
    });

    if (customerId && customerId !== component.ownerCustomerId) {
      await this.equipment.resyncComponentEquipmentOwner(companyId, id, customerId);
    }

    const [decorated] = await this.decorate(companyId, [updated]);
    return decorated;
  }

  async generateOwnerAccount(companyId: string, id: string) {
    const component = await this.getOrThrow(companyId, id);
    if (!component.ownerCustomerId) throw new BadRequestException('Assign an owner to this component first');
    // Generic already — keyed only by customerId, the "House" in its name is legacy.
    return this.auth.provisionHouseOwnerAccount(companyId, component.ownerCustomerId);
  }

  // ── Portal ────────────────────────────────────────────────────────────────

  /** Customer-scoped components for the portal (role=CUSTOMER). Usually 0 or 1, but
   *  a customer could own more than one component across projects. */
  async mine(companyId: string, customerId: string) {
    const components = await this.prisma.projectComponent.findMany({
      where: { companyId, ownerCustomerId: customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    if (components.length === 0) return [];
    const projectIds = [...new Set(components.map((c) => c.projectId))];
    const projects = await this.prisma.project.findMany({
      where: { companyId, id: { in: projectIds } },
      select: { id: true, name: true },
    });
    const names = new Map(projects.map((p) => [p.id, p.name]));
    return components.map((c) => ({ ...c, projectName: names.get(c.projectId) ?? '—' }));
  }

  private async assertOwnsComponent(companyId: string, componentId: string, customerId: string) {
    const component = await this.prisma.projectComponent.findFirst({ where: { id: componentId, companyId } });
    if (!component) throw new NotFoundException('Component not found');
    if (component.ownerCustomerId !== customerId) throw new ForbiddenException('You can only view your own component');
    return component;
  }

  // ── Issue reports ─────────────────────────────────────────────────────────

  async listIssuesForComponent(companyId: string, componentId: string) {
    await this.getOrThrow(companyId, componentId);
    return this.prisma.componentIssueReport.findMany({
      where: { companyId, componentId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async listMyIssues(companyId: string, customerId: string) {
    return this.prisma.componentIssueReport.findMany({
      where: { companyId, reportedByCustomerId: customerId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  /** Portal: component owner reports an error code on their equipment. */
  async createIssue(
    companyId: string,
    customerId: string,
    componentId: string,
    input: { equipmentId?: string; errorCode?: string; description?: string },
  ) {
    await this.assertOwnsComponent(companyId, componentId, customerId);
    if (input.equipmentId) {
      const eq = await this.prisma.equipment.findFirst({
        where: { id: input.equipmentId, companyId, componentId },
      });
      if (!eq) throw new BadRequestException('Equipment not found on this component');
    }
    if (!input.errorCode?.trim() && !input.description?.trim()) {
      throw new BadRequestException('Provide an error code or a description');
    }
    return this.prisma.componentIssueReport.create({
      data: {
        companyId,
        componentId,
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
    const issue = await this.prisma.componentIssueReport.findFirst({ where: { id: issueId, companyId } });
    if (!issue) throw new NotFoundException('Issue report not found');
    return this.prisma.componentIssueReport.update({
      where: { id: issueId },
      data: { status: input.status, resolvedNote: input.resolvedNote ?? issue.resolvedNote },
    });
  }

  /** Rolled-up open-issue count across every component on a project (Project detail badge). */
  async openIssueCountForProject(companyId: string, projectId: string) {
    return this.prisma.componentIssueReport.count({
      where: { companyId, status: { not: 'RESOLVED' }, component: { projectId } },
    });
  }

  /**
   * Every open/acknowledged issue report across the whole company, with enough
   * context (component, project, reporter) to render a real alert — not just a
   * count — on the admin Dashboard.
   */
  async openIssuesForCompany(companyId: string) {
    const issues = await this.prisma.componentIssueReport.findMany({
      where: { companyId, status: { not: 'RESOLVED' } },
      orderBy: { createdAt: 'desc' },
      include: { component: { include: { project: { select: { id: true, name: true } } } } },
      take: 500,
    });
    if (issues.length === 0) return [];

    const reporterIds = [...new Set(issues.map((i) => i.reportedByCustomerId))];
    const reporters = await this.prisma.customer.findMany({
      where: { companyId, id: { in: reporterIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const reporterName = new Map(reporters.map((r) => [r.id, `${r.firstName} ${r.lastName}`.trim()]));

    return issues.map((i: any) => ({
      id: i.id,
      componentId: i.componentId,
      componentLabel: i.component.label,
      projectId: i.component.project.id,
      projectName: i.component.project.name,
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
    const component = await this.prisma.projectComponent.findFirst({ where: { id, companyId } });
    if (!component) throw new NotFoundException('Component not found');
    return component;
  }

  private async getProjectOrThrow(companyId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, companyId } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  /** Looks up an already-registered type by its key — used where the key is already
   * known (e.g. an existing component's own componentTypeKey), not where a
   * human-typed label needs resolving (see resolveOrRegisterType). */
  private findTypeByKey(project: any, componentTypeKey: string): { key: string; label: string; customerAssignable: boolean } {
    const snapshot = (project.componentTypesSnapshot as Array<{ key: string; label: string; customerAssignable: boolean }> | null) ?? [];
    const type = snapshot.find((t) => t.key === componentTypeKey);
    if (!type) {
      throw new BadRequestException(`"${componentTypeKey}" is not a registered component type on this project`);
    }
    return type;
  }

  /**
   * Resolves a human-typed type name against the project's own componentTypesSnapshot
   * (its growable type registry) case-insensitively. A match returns the existing
   * type unchanged — typeAssignable is ignored on a match, since an existing type's
   * ceiling isn't redefined by typing it again (that's what Settings/Template
   * editing is for). No match appends a new type (key derived via slugify(),
   * suffixed on collision) to the project before the caller's component is created.
   */
  private async resolveOrRegisterType(
    project: any,
    typeLabel: string,
    typeAssignable: boolean | undefined,
  ): Promise<{ key: string; label: string; customerAssignable: boolean }> {
    const snapshot = (project.componentTypesSnapshot as Array<{ key: string; label: string; customerAssignable: boolean }> | null) ?? [];
    const existing = snapshot.find((t) => t.label.toLowerCase() === typeLabel.trim().toLowerCase());
    if (existing) return existing;

    if (project.componentTypesSnapshot == null) {
      throw new BadRequestException('This project has no component template — components cannot be added');
    }

    let key = slugify(typeLabel);
    const existingKeys = new Set(snapshot.map((t) => t.key));
    let suffix = 2;
    while (existingKeys.has(key)) {
      key = `${slugify(typeLabel)}-${suffix}`;
      suffix++;
    }

    const newType = { key, label: typeLabel.trim(), customerAssignable: typeAssignable ?? true };
    const updatedSnapshot = [...snapshot, newType];
    const updatedSettings = { ...((project.componentCustomerSettings as object) ?? {}), [key]: newType.customerAssignable };

    await this.prisma.project.update({
      where: { id: project.id },
      data: { componentTypesSnapshot: updatedSnapshot, componentCustomerSettings: updatedSettings },
    });

    return newType;
  }

  /**
   * Two-tier check: the template's own customerAssignable is the ceiling (a project
   * can never widen it), and componentCustomerSettings is this project's own
   * narrower override. Both must be true for an owner to be set.
   */
  private assertOwnerAllowed(project: any, componentType: { key: string; customerAssignable: boolean }) {
    if (!componentType.customerAssignable) {
      throw new BadRequestException(`"${componentType.key}" is not customer-assignable on this project's template`);
    }
    const settings = (project.componentCustomerSettings as Record<string, boolean> | null) ?? {};
    if (settings[componentType.key] !== true) {
      throw new BadRequestException(`Customer assignment for "${componentType.key}" is turned off for this project`);
    }
  }

  /** Used by controller-level ownership checks for customer-facing equipment endpoints. */
  async getOwnerCustomerId(companyId: string, id: string): Promise<string | null> {
    const component = await this.getOrThrow(companyId, id);
    return component.ownerCustomerId;
  }

  /** Attach ownerName + account status so lists render without extra round-trips. */
  private async decorate(companyId: string, components: any[]) {
    if (components.length === 0) return [];
    const ownerIds = [...new Set(components.map((c) => c.ownerCustomerId).filter(Boolean))] as string[];
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

    const componentIds = components.map((c) => c.id);
    const [equipmentCounts, issueCounts] = await Promise.all([
      this.prisma.equipment.groupBy({
        by: ['componentId'], where: { companyId, componentId: { in: componentIds } }, _count: { _all: true },
      }),
      this.prisma.componentIssueReport.groupBy({
        by: ['componentId'], where: { companyId, componentId: { in: componentIds }, status: { not: 'RESOLVED' } }, _count: { _all: true },
      }),
    ]);
    const equipmentCountByComponent = new Map(equipmentCounts.map((c) => [c.componentId, c._count._all]));
    const issueCountByComponent = new Map(issueCounts.map((c) => [c.componentId, c._count._all]));

    return components.map((c) => {
      const owner = c.ownerCustomerId ? ownerById.get(c.ownerCustomerId) : undefined;
      const user = owner?.auth0UserId ? userById.get(owner.auth0UserId) : undefined;

      let accountStatus: 'NO_OWNER' | 'NO_ACCOUNT' | 'INVITED' | 'ACTIVE' = 'NO_OWNER';
      if (owner) {
        if (!user || !user.isActive) accountStatus = 'NO_ACCOUNT';
        else if (user.lastLoginAt) accountStatus = 'ACTIVE';
        else if (user.mustResetPassword) accountStatus = 'INVITED';
        else accountStatus = 'ACTIVE';
      }

      return {
        ...c,
        ownerName: owner ? `${owner.firstName} ${owner.lastName}`.trim() : null,
        ownerEmail: owner?.email ?? null,
        accountStatus,
        equipmentCount: equipmentCountByComponent.get(c.id) ?? 0,
        openIssueCount: issueCountByComponent.get(c.id) ?? 0,
      };
    });
  }
}
