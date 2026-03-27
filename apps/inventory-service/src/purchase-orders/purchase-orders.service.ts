import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockOperationsService } from '../stock-operations/stock-operations.service';
import { LocationsService } from '../locations/locations.service';
import { PurchaseOrderStatus } from '../prisma/generated';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

function systemToken(companyId: string): string {
  const secret = process.env.JWT_SECRET || 'tscrm-local-jwt-secret-change-in-production';
  return jwt.sign(
    { sub: 'system-inventory-service', company_id: companyId, role: 'company_admin', name: 'Inventory Service', iss: 'tscrm-local' },
    secret,
    { expiresIn: '5m' },
  );
}

interface POItem { inventoryItemId: string; qty: number; unitCost: number; }

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockOps: StockOperationsService,
    private readonly locations: LocationsService,
  ) {}

  async findAll(companyId: string, page = 1, limit = 20, status?: string) {
    const where: any = { companyId };
    if (status) where.status = status;

    const [data, count] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return { data, count, page, limit };
  }

  async findOne(companyId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, companyId } });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async create(companyId: string, userId: string, userName: string, dto: {
    supplierName: string; items: POItem[]; notes?: string;
  }) {
    // Generate PO number
    const year = new Date().getFullYear();
    const count = await this.prisma.purchaseOrder.count({
      where: { companyId, poNumber: { startsWith: `PO-${year}` } },
    });
    const poNumber = `PO-${year}-${String(count + 1).padStart(4, '0')}`;
    const totalCost = dto.items.reduce((sum, i) => sum + i.qty * i.unitCost, 0);

    return this.prisma.purchaseOrder.create({
      data: {
        companyId,
        poNumber,
        supplierName: dto.supplierName,
        items: dto.items as any,
        totalCost,
        notes: dto.notes,
        createdBy: userId,
        createdByName: userName,
      },
    });
  }

  async updateStatus(companyId: string, id: string, status: PurchaseOrderStatus) {
    const po = await this.findOne(companyId, id);

    const validTransitions: Record<string, string[]> = {
      DRAFT: ['ORDERED', 'CANCELLED'],
      ORDERED: ['PARTIAL', 'RECEIVED', 'CANCELLED'],
      PARTIAL: ['RECEIVED', 'CANCELLED'],
    };

    const allowed = validTransitions[po.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${po.status} to ${status}`);
    }

    const data: any = { status };
    if (status === 'ORDERED') data.orderedAt = new Date();
    if (status === 'RECEIVED') data.receivedAt = new Date();

    return this.prisma.purchaseOrder.update({ where: { id }, data });
  }

  async receive(companyId: string, userId: string, userName: string, id: string, receivedItems?: { inventoryItemId: string; qty: number }[]) {
    const po = await this.findOne(companyId, id);
    if (po.status !== 'ORDERED' && po.status !== 'PARTIAL') {
      throw new BadRequestException('PO must be ORDERED or PARTIAL to receive');
    }

    const warehouse = await this.locations.ensureWarehouse(companyId);
    const items = receivedItems ?? (po.items as unknown as POItem[]);

    // Create intake movements for each item
    for (const item of items) {
      await this.stockOps.intake(companyId, userId, userName, {
        inventoryItemId: item.inventoryItemId,
        toLocationId: warehouse.id,
        quantity: item.qty,
        referenceId: po.id,
        notes: `Received from PO ${po.poNumber}`,
      });
    }

    // Determine status: if we received all items, mark RECEIVED; otherwise PARTIAL
    const poItems = po.items as unknown as POItem[];
    const allReceived = !receivedItems || receivedItems.length >= poItems.length;
    const newStatus = allReceived ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIAL;

    const updatedPo = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: newStatus, receivedAt: newStatus === 'RECEIVED' ? new Date() : undefined },
    });

    // Auto-create expense when PO is fully received
    if (newStatus === PurchaseOrderStatus.RECEIVED) {
      this.createExpenseForPO(companyId, userId, updatedPo);
    }

    return updatedPo;
  }

  private async createExpenseForPO(companyId: string, userId: string, po: any) {
    try {
      const token = systemToken(companyId);
      const financeBase = process.env.FINANCE_SERVICE_URL || 'http://localhost:3004';

      await axios.post(`${financeBase}/expenses`, {
        description: `PO ${po.poNumber} - ${po.supplierName}`,
        amount: Number(po.totalCost),
        vendor: po.supplierName,
        category: 'PARTS',
        expenseDate: new Date().toISOString(),
        isReimbursable: false,
      }, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      console.log(`[inventory] Created expense for PO ${po.poNumber}`);
    } catch (err: any) {
      console.warn('[inventory] Expense creation failed:', err?.message);
    }
  }
}
