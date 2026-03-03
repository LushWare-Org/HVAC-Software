import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TradeTemplatesService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // JOB TYPES
  // ============================================================

  async findAllJobTypes(companyId: string) {
    return this.prisma.jobType.findMany({
      where: { companyId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { templates: true, jobs: true } },
      },
    });
  }

  async createJobType(
    companyId: string,
    data: {
      name: string;
      slug: string;
      description?: string;
      icon?: string;
      color?: string;
      sortOrder?: number;
    },
  ) {
    const existing = await this.prisma.jobType.findUnique({
      where: { companyId_slug: { companyId, slug: data.slug } },
    });
    if (existing) {
      throw new ConflictException(`Job type with slug "${data.slug}" already exists`);
    }
    return this.prisma.jobType.create({ data: { ...data, companyId } });
  }

  async updateJobType(companyId: string, id: string, data: Partial<{
    name: string; description: string; icon: string; color: string;
    sortOrder: number; isActive: boolean;
  }>) {
    await this.findJobTypeOrFail(companyId, id);
    return this.prisma.jobType.update({ where: { id }, data });
  }

  // ============================================================
  // JOB TEMPLATES
  // ============================================================

  async findTemplatesByType(companyId: string, jobTypeId: string) {
    await this.findJobTypeOrFail(companyId, jobTypeId);
    return this.prisma.jobTemplate.findMany({
      where: { companyId, jobTypeId, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        tasks: { orderBy: { taskOrder: 'asc' } },
        _count: { select: { jobs: true } },
      },
    });
  }

  async findTemplateById(companyId: string, id: string) {
    const template = await this.prisma.jobTemplate.findFirst({
      where: { id, companyId },
      include: {
        tasks: { orderBy: { taskOrder: 'asc' } },
        jobType: true,
      },
    });
    if (!template) throw new NotFoundException(`Template ${id} not found`);
    return template;
  }

  async createTemplate(
    companyId: string,
    data: {
      jobTypeId: string;
      name: string;
      description?: string;
      estimatedDurationMins?: number;
      tasks?: Array<{
        taskName: string;
        description?: string;
        taskOrder: number;
        isRequired?: boolean;
        photoRequired?: boolean;
        safetyNote?: string;
        estimatedMins?: number;
      }>;
    },
  ) {
    await this.findJobTypeOrFail(companyId, data.jobTypeId);
    const { tasks, ...rest } = data;
    return this.prisma.jobTemplate.create({
      data: {
        ...rest,
        companyId,
        tasks: tasks ? { create: tasks } : undefined,
      },
      include: { tasks: { orderBy: { taskOrder: 'asc' } } },
    });
  }

  async updateTemplate(
    companyId: string,
    id: string,
    data: Partial<{
      name: string;
      description: string;
      estimatedDurationMins: number;
      isActive: boolean;
    }>,
  ) {
    await this.findTemplateById(companyId, id);
    return this.prisma.jobTemplate.update({ where: { id }, data });
  }

  // ============================================================
  // TEMPLATE TASKS (manage tasks within a template)
  // ============================================================

  async addTask(
    companyId: string,
    templateId: string,
    data: {
      taskName: string;
      description?: string;
      taskOrder: number;
      isRequired?: boolean;
      photoRequired?: boolean;
      safetyNote?: string;
      estimatedMins?: number;
    },
  ) {
    await this.findTemplateById(companyId, templateId);
    return this.prisma.jobTemplateTask.create({ data: { ...data, templateId } });
  }

  async updateTask(
    companyId: string,
    templateId: string,
    taskId: string,
    data: Partial<{
      taskName: string;
      description: string;
      taskOrder: number;
      isRequired: boolean;
      photoRequired: boolean;
      safetyNote: string;
      estimatedMins: number;
    }>,
  ) {
    await this.findTemplateById(companyId, templateId);
    const task = await this.prisma.jobTemplateTask.findFirst({
      where: { id: taskId, templateId },
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    return this.prisma.jobTemplateTask.update({ where: { id: taskId }, data });
  }

  async removeTask(companyId: string, templateId: string, taskId: string) {
    await this.findTemplateById(companyId, templateId);
    const task = await this.prisma.jobTemplateTask.findFirst({
      where: { id: taskId, templateId },
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    return this.prisma.jobTemplateTask.delete({ where: { id: taskId } });
  }

  async reorderTasks(companyId: string, templateId: string, taskIds: string[]) {
    await this.findTemplateById(companyId, templateId);
    await this.prisma.$transaction(
      taskIds.map((id, index) =>
        this.prisma.jobTemplateTask.update({
          where: { id },
          data: { taskOrder: index + 1 },
        }),
      ),
    );
    return this.findTemplateById(companyId, templateId);
  }

  // ============================================================
  // CUSTOM FIELD DEFINITIONS
  // ============================================================

  async findCustomFieldDefs(companyId: string, jobTypeId: string) {
    await this.findJobTypeOrFail(companyId, jobTypeId);
    return this.prisma.jobCustomFieldDef.findMany({
      where: { jobTypeId, companyId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCustomFieldDef(
    companyId: string,
    jobTypeId: string,
    data: {
      fieldKey: string;
      label: string;
      fieldType: string;
      options?: string[];
      isRequired?: boolean;
      helpText?: string;
      sortOrder?: number;
    },
  ) {
    await this.findJobTypeOrFail(companyId, jobTypeId);
    return this.prisma.jobCustomFieldDef.create({
      data: {
        ...data,
        companyId,
        jobTypeId,
        fieldType: data.fieldType as any,
        options: data.options ? data.options : undefined,
      },
    });
  }

  async updateCustomFieldDef(
    companyId: string,
    defId: string,
    data: Partial<{
      label: string;
      options: string[];
      isRequired: boolean;
      helpText: string;
      sortOrder: number;
      isActive: boolean;
    }>,
  ) {
    const def = await this.prisma.jobCustomFieldDef.findFirst({
      where: { id: defId, companyId },
    });
    if (!def) throw new NotFoundException(`Custom field definition not found`);
    return this.prisma.jobCustomFieldDef.update({ where: { id: defId }, data });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async findJobTypeOrFail(companyId: string, id: string) {
    const jt = await this.prisma.jobType.findFirst({ where: { id, companyId } });
    if (!jt) throw new NotFoundException(`Job type ${id} not found`);
    return jt;
  }
}
