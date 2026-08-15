/**
 * ProjectTemplatesService — reusable, admin-authored "recipes" for a Project's
 * component structure. Spec: docs/superpowers/specs/2026-08-14-project-component-templates-design.md
 *
 * Editing a template only affects projects created AFTER the edit — an already-
 * created Project holds a frozen copy of componentTypes as Project.componentTypesSnapshot
 * (see projects.service.ts), so this service never needs to worry about live projects
 * when it mutates a template.
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ComponentTypeInput {
  key: string;
  label: string;
  icon?: string;
  customerAssignable: boolean;
}

export interface UpsertTemplateInput {
  name?: string;
  description?: string | null;
  componentTypes?: ComponentTypeInput[];
  status?: string;
}

function validateComponentTypes(types: ComponentTypeInput[] | undefined) {
  if (types === undefined) return;
  if (types.length === 0) throw new BadRequestException('A template needs at least one component type');
  const keys = types.map((t) => t.key);
  if (new Set(keys).size !== keys.length) {
    throw new BadRequestException('Component type keys must be unique within a template');
  }
  for (const t of types) {
    if (!t.key?.trim()) throw new BadRequestException('Every component type needs a key');
    if (!t.label?.trim()) throw new BadRequestException('Every component type needs a label');
  }
}

@Injectable()
export class ProjectTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId: string) {
    return this.prisma.projectTemplate.findMany({
      where: { companyId },
      orderBy: [{ isBuiltIn: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(companyId: string, id: string) {
    const t = await this.prisma.projectTemplate.findFirst({ where: { id, companyId } });
    if (!t) throw new NotFoundException('Template not found');
    return t;
  }

  async create(companyId: string, input: { name: string; description?: string; componentTypes: ComponentTypeInput[] }) {
    if (!input.name?.trim()) throw new BadRequestException('name is required');
    validateComponentTypes(input.componentTypes);
    return this.prisma.projectTemplate.create({
      data: {
        companyId,
        name: input.name.trim(),
        description: input.description ?? null,
        componentTypes: input.componentTypes as any,
        status: 'DRAFT', // never accepted from the caller — a template can't be published before it exists to review
      },
    });
  }

  async update(companyId: string, id: string, input: UpsertTemplateInput) {
    const existing = await this.findOne(companyId, id);
    if (existing.isBuiltIn) {
      throw new BadRequestException('Built-in templates cannot be edited — duplicate it into a custom template instead');
    }
    validateComponentTypes(input.componentTypes);
    if (input.status !== undefined && !['DRAFT', 'PUBLISHED'].includes(input.status)) {
      throw new BadRequestException("status must be 'DRAFT' or 'PUBLISHED'");
    }
    const data: any = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.description !== undefined) data.description = input.description;
    if (input.componentTypes !== undefined) data.componentTypes = input.componentTypes;
    if (input.status !== undefined) data.status = input.status;
    return this.prisma.projectTemplate.update({ where: { id }, data });
  }

  async remove(companyId: string, id: string) {
    const existing = await this.findOne(companyId, id);
    if (existing.isBuiltIn) throw new BadRequestException('Built-in templates cannot be deleted');
    const inUse = await this.prisma.project.count({ where: { companyId, templateId: id } });
    if (inUse > 0) throw new BadRequestException(`${inUse} project(s) use this template — cannot delete`);
    await this.prisma.projectTemplate.delete({ where: { id } });
    return { success: true };
  }
}
