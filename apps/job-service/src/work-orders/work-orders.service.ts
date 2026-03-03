import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '@tscrm/types';

@Injectable()
export class WorkOrdersService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // CREATE — spawns a work order from a job (optionally with template tasks)
  // ============================================================

  async create(
    companyId: string,
    user: AuthUser,
    data: {
      jobId: string;
      technicianId: string;
      technicianName: string;
      scheduledStart?: string;
      scheduledEnd?: string;
    },
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: data.jobId, companyId },
      include: { template: { include: { tasks: { orderBy: { taskOrder: 'asc' } } } } },
    });
    if (!job) throw new NotFoundException('Job not found');

    const workOrderNumber = await this.generateWONumber(companyId);

    return this.prisma.workOrder.create({
      data: {
        companyId,
        jobId: data.jobId,
        workOrderNumber,
        technicianId: data.technicianId,
        technicianName: data.technicianName,
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : undefined,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
        // Pre-populate task completions from the job template
        taskCompletions: job.template?.tasks?.length
          ? {
              create: job.template.tasks.map((task) => ({
                templateTaskId: task.id,
                taskName: task.taskName,
                isCompleted: false,
              })),
            }
          : undefined,
      },
      include: {
        taskCompletions: true,
        lineItems: true,
      },
    });
  }

  // ============================================================
  // GET — by job
  // ============================================================

  async findByJob(companyId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, companyId } });
    if (!job) throw new NotFoundException('Job not found');

    return this.prisma.workOrder.findMany({
      where: { jobId, companyId },
      include: {
        taskCompletions: { orderBy: { templateTaskId: 'asc' } },
        lineItems: { include: { priceBookItem: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const wo = await this.prisma.workOrder.findFirst({
      where: { id, companyId },
      include: {
        taskCompletions: true,
        lineItems: { include: { priceBookItem: true } },
        job: { select: { id: true, jobNumber: true, title: true, status: true } },
      },
    });
    if (!wo) throw new NotFoundException(`Work order ${id} not found`);
    return wo;
  }

  // ============================================================
  // STATUS — check in / check out
  // ============================================================

  async checkIn(companyId: string, id: string, userId: string) {
    const wo = await this.findOne(companyId, id);
    if (wo.status !== 'PENDING') {
      throw new BadRequestException('Work order must be in PENDING status to check in');
    }
    return this.prisma.workOrder.update({
      where: { id },
      data: { status: 'ON_SITE', checkinAt: new Date() },
    });
  }

  async checkOut(companyId: string, id: string, notes?: string) {
    const wo = await this.findOne(companyId, id);
    if (wo.status === 'COMPLETED') {
      throw new BadRequestException('Work order is already completed');
    }
    return this.prisma.workOrder.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        checkoutAt: new Date(),
        ...(notes && { technicianNotes: notes }),
      },
    });
  }

  // ============================================================
  // TASK COMPLETIONS — technician ticks off checklist
  // ============================================================

  async completeTask(
    companyId: string,
    workOrderId: string,
    taskCompletionId: string,
    data: { isCompleted: boolean; notes?: string; photoUrl?: string },
  ) {
    const wo = await this.findOne(companyId, workOrderId);
    const task = wo.taskCompletions.find((t) => t.id === taskCompletionId);
    if (!task) throw new NotFoundException('Task not found on this work order');

    return this.prisma.workOrderTaskCompletion.update({
      where: { id: taskCompletionId },
      data: {
        isCompleted: data.isCompleted,
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.photoUrl && { photoUrl: data.photoUrl }),
        completedAt: data.isCompleted ? new Date() : null,
      },
    });
  }

  // ============================================================
  // LINE ITEMS — parts and labour used on-site
  // ============================================================

  async addLineItem(
    companyId: string,
    workOrderId: string,
    data: {
      priceBookItemId?: string;
      description: string;
      category: string;
      quantity: number;
      unitPrice: number;
      taxable?: boolean;
    },
  ) {
    await this.findOne(companyId, workOrderId);

    // If referencing price book, verify it belongs to company
    if (data.priceBookItemId) {
      const pbItem = await this.prisma.priceBookItem.findFirst({
        where: { id: data.priceBookItemId, companyId },
      });
      if (!pbItem) throw new NotFoundException('Price book item not found');
    }

    const lineTotal = data.quantity * data.unitPrice;
    return this.prisma.workOrderLineItem.create({
      data: {
        workOrderId,
        ...data,
        category: data.category as any,
        lineTotal,
      },
    });
  }

  async removeLineItem(companyId: string, workOrderId: string, lineItemId: string) {
    await this.findOne(companyId, workOrderId);
    const item = await this.prisma.workOrderLineItem.findFirst({
      where: { id: lineItemId, workOrderId },
    });
    if (!item) throw new NotFoundException('Line item not found');
    return this.prisma.workOrderLineItem.delete({ where: { id: lineItemId } });
  }

  // ============================================================
  // SUMMARY — for finance-service to pull when creating invoice
  // ============================================================

  async getSummaryForInvoice(companyId: string, jobId: string) {
    const workOrders = await this.findByJob(companyId, jobId);
    const allLineItems = workOrders.flatMap((wo) => wo.lineItems);
    const subtotal = allLineItems.reduce(
      (sum, item) => sum + Number(item.lineTotal),
      0,
    );
    const taxableAmount = allLineItems
      .filter((i) => i.taxable)
      .reduce((sum, item) => sum + Number(item.lineTotal), 0);
    return { workOrders, allLineItems, subtotal, taxableAmount };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async generateWONumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.workOrder.count({
      where: { companyId, workOrderNumber: { startsWith: `WO-${year}-` } },
    });
    return `WO-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
