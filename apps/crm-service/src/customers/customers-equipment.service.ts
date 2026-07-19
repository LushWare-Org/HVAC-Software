/**
 * CustomersEquipmentService — equipment CRUD scoped to a customer.
 *
 * Extracted from CustomersService (Session 15, 2026-05-08) to start unwinding
 * the 821-line god-class. Equipment is genuinely independent of customer
 * insight/prediction logic — moving it out has zero blast radius.
 *
 * Each mutation triggers `upsellAgent.processCustomerProfileUpdate()` because
 * a new appliance immediately changes the upsell signal (e.g. a 9-yr-old
 * boiler suggests replacement; a fresh install closes that path).
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TtlCacheService } from '../cache/ttl-cache.service';
import { UpsellAgentService } from '../upsell/upsell-agent.service';

export interface EquipmentInput {
  type: string;
  brand?: string;
  model?: string;
  serialNo?: string;
  installDate?: string;
  warrantyEnd?: string;
  notes?: string;
}

@Injectable()
export class CustomersEquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly upsellAgent: UpsellAgentService,
    private readonly ttlCache: TtlCacheService,
  ) {}

  /** Verify the customer exists under this company. Throws NotFound otherwise. */
  private async assertCustomer(companyId: string, customerId: string): Promise<void> {
    const exists = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Customer ${customerId} not found`);
  }

  async list(companyId: string, customerId: string) {
    await this.assertCustomer(companyId, customerId);
    return this.prisma.equipment.findMany({
      where: { customerId, companyId },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async create(companyId: string, customerId: string, dto: EquipmentInput) {
    await this.assertCustomer(companyId, customerId);
    const equipment = await this.prisma.equipment.create({
      data: {
        companyId,
        customerId,
        type: dto.type,
        brand: dto.brand,
        model: dto.model,
        serialNo: dto.serialNo,
        installDate: dto.installDate ? new Date(dto.installDate) : undefined,
        warrantyEnd: dto.warrantyEnd ? new Date(dto.warrantyEnd) : undefined,
        notes: dto.notes,
      },
    });

    this.ttlCache.del(`status-summary:${companyId}:${customerId}`);
    void this.upsellAgent.processCustomerProfileUpdate(companyId, customerId);
    return equipment;
  }

  async update(
    companyId: string,
    customerId: string,
    eqId: string,
    dto: Partial<EquipmentInput>,
  ) {
    await this.assertCustomer(companyId, customerId);
    const eq = await this.prisma.equipment.findFirst({ where: { id: eqId, customerId, companyId } });
    if (!eq) throw new NotFoundException(`Equipment ${eqId} not found`);
    const equipment = await this.prisma.equipment.update({
      where: { id: eqId },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.brand !== undefined && { brand: dto.brand }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.serialNo !== undefined && { serialNo: dto.serialNo }),
        ...(dto.installDate !== undefined && { installDate: dto.installDate ? new Date(dto.installDate) : null }),
        ...(dto.warrantyEnd !== undefined && { warrantyEnd: dto.warrantyEnd ? new Date(dto.warrantyEnd) : null }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    this.ttlCache.del(`status-summary:${companyId}:${customerId}`);
    void this.upsellAgent.processCustomerProfileUpdate(companyId, customerId);
    return equipment;
  }

  async remove(companyId: string, customerId: string, eqId: string) {
    await this.assertCustomer(companyId, customerId);
    const eq = await this.prisma.equipment.findFirst({ where: { id: eqId, customerId, companyId } });
    if (!eq) throw new NotFoundException(`Equipment ${eqId} not found`);
    const deleted = await this.prisma.equipment.delete({ where: { id: eqId } });
    this.ttlCache.del(`status-summary:${companyId}:${customerId}`);
    void this.upsellAgent.processCustomerProfileUpdate(companyId, customerId);
    return deleted;
  }
}
