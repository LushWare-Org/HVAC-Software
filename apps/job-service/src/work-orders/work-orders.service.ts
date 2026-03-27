import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '@tscrm/types';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

function systemToken(companyId: string): string {
  const secret = process.env.JWT_SECRET || 'tscrm-local-jwt-secret-change-in-production';
  return jwt.sign(
    { sub: 'system-job-service', company_id: companyId, role: 'company_admin', name: 'Job Service', iss: 'tscrm-local' },
    secret,
    { expiresIn: '5m' },
  );
}

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
      technicianId?: string;
      technicianName?: string;
      scheduledStart?: string;
      scheduledEnd?: string;
    },
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: data.jobId, companyId },
      include: { template: { include: { tasks: { orderBy: { taskOrder: 'asc' } } } } },
    });
    if (!job) throw new NotFoundException('Job not found');

    // Derive technician from job assignment if not explicitly provided
    const technicianId = data.technicianId || (job as any).assignedToId || user.userId;
    const technicianName = data.technicianName || (job as any).assignedToName || user.name || 'Admin';

    const workOrderNumber = await this.generateWONumber(companyId);

    return this.prisma.workOrder.create({
      data: {
        companyId,
        jobId: data.jobId,
        workOrderNumber,
        technicianId,
        technicianName,
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : undefined,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
        taskCompletions: job.template?.tasks?.length
          ? {
              create: job.template.tasks.map((task) => ({
                templateTaskId: task.id,
                taskName: task.taskName,
                isRequired: (task as any).isRequired ?? false,
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
  // AD-HOC TASKS — admin/manager adds a task manually
  // ============================================================

  async addAdHocTask(
    companyId: string,
    workOrderId: string,
    data: { taskName: string; isRequired?: boolean },
  ) {
    await this.findOne(companyId, workOrderId);
    return this.prisma.workOrderTaskCompletion.create({
      data: {
        workOrderId,
        taskName: data.taskName,
        isRequired: data.isRequired ?? false,
        isAdHoc: true,
        isCompleted: false,
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
    const lineItem = await this.prisma.workOrderLineItem.create({
      data: {
        workOrderId,
        ...data,
        category: data.category as any,
        lineTotal,
      },
    });

    // Fire-and-forget: auto-consume inventory for PART/MATERIAL line items
    if (
      data.priceBookItemId &&
      (data.category === 'PART' || data.category === 'MATERIAL')
    ) {
      this.autoConsumeInventory(companyId, workOrderId, data.priceBookItemId, data.quantity)
        .catch(() => {}); // swallow unhandled rejection
    }

    return lineItem;
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
  // INVENTORY AUTO-CONSUME (fire-and-forget)
  // ============================================================

  private async autoConsumeInventory(
    companyId: string,
    workOrderId: string,
    priceBookItemId: string,
    quantity: number,
  ) {
    try {
      const wo = await this.prisma.workOrder.findFirst({ where: { id: workOrderId } });
      if (!wo) return;

      const token = systemToken(companyId);
      const inventoryBase = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3007';
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      // 1. Find inventory item by priceBookItemId
      const itemsRes = await axios.get(`${inventoryBase}/items`, { headers, params: { priceBookItemId } });
      const items = itemsRes.data?.data ?? itemsRes.data ?? [];
      if (!items.length) return; // No matching inventory item
      const inventoryItemId = items[0].id;

      // 2. Find tech's van location
      const locRes = await axios.get(`${inventoryBase}/locations`, { headers });
      const locations = locRes.data?.data ?? locRes.data ?? [];
      const vanLocation = locations.find((l: any) => l.type === 'VAN' && l.technicianId === wo.technicianId);
      if (!vanLocation) return; // No van location for this tech

      // 3. Consume inventory
      await axios.post(`${inventoryBase}/movements/consume`, {
        inventoryItemId,
        locationId: vanLocation.id,
        quantity,
        referenceId: workOrderId,
        referenceType: 'work_order',
      }, { headers });

      console.log(`[inventory] Auto-consumed ${quantity}x item ${inventoryItemId} from van ${vanLocation.name}`);
    } catch (err: any) {
      console.warn('[inventory] Auto-consume failed (non-blocking):', err?.message);
    }
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
