import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ConsumableDto {
  kind?: string;
  partNumber?: string;
  description?: string;
  sizeSpec?: string;
  rating?: string;
  intervalDays?: number;
  lastReplacedAt?: string;
  purchaseUrl?: string;
}

const DAY_MS = 86_400_000;

@Injectable()
export class ConsumablesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Due date = (lastReplacedAt ?? equipment installDate) + intervalDays. Null when no anchor. */
  computeNextDue(
    c: { lastReplacedAt: Date | null; intervalDays: number },
    installDate: Date | null,
  ): Date | null {
    const anchor = c.lastReplacedAt ?? installDate;
    if (!anchor) return null;
    return new Date(anchor.getTime() + c.intervalDays * DAY_MS);
  }

  private withDue<
    T extends {
      lastReplacedAt: Date | null;
      intervalDays: number;
      equipment?: { installDate: Date | null };
    },
  >(c: T) {
    const nextDueAt = this.computeNextDue(c, c.equipment?.installDate ?? null);
    const dueInDays = nextDueAt ? Math.ceil((nextDueAt.getTime() - Date.now()) / DAY_MS) : null;
    const { equipment: _omit, ...rest } = c as any;
    return { ...rest, nextDueAt, dueInDays };
  }

  private async assertEquipment(companyId: string, equipmentId: string) {
    const eq = await this.prisma.equipment.findFirst({ where: { id: equipmentId, companyId } });
    if (!eq) throw new NotFoundException(`Equipment ${equipmentId} not found`);
    return eq;
  }

  private async assertOwned(companyId: string, id: string) {
    const row = await this.prisma.equipmentConsumable.findFirst({ where: { id, companyId } });
    if (!row) throw new NotFoundException(`Consumable ${id} not found`);
    return row;
  }

  async listForEquipment(companyId: string, equipmentId: string) {
    const rows = await this.prisma.equipmentConsumable.findMany({
      where: { equipmentId, companyId },
      include: { equipment: { select: { installDate: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.withDue(r));
  }

  async create(companyId: string, equipmentId: string, dto: ConsumableDto) {
    await this.assertEquipment(companyId, equipmentId);
    return this.prisma.equipmentConsumable.create({
      data: {
        companyId, // always from the caller's token, never the body
        equipmentId,
        kind: dto.kind ?? 'FILTER',
        partNumber: dto.partNumber,
        description: dto.description,
        sizeSpec: dto.sizeSpec,
        rating: dto.rating,
        intervalDays: dto.intervalDays ?? 90,
        lastReplacedAt: dto.lastReplacedAt ? new Date(dto.lastReplacedAt) : null,
        purchaseUrl: dto.purchaseUrl,
      },
    });
  }

  async update(companyId: string, id: string, dto: ConsumableDto) {
    await this.assertOwned(companyId, id);
    return this.prisma.equipmentConsumable.update({
      where: { id },
      data: {
        ...(dto.kind !== undefined && { kind: dto.kind }),
        ...(dto.partNumber !== undefined && { partNumber: dto.partNumber }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sizeSpec !== undefined && { sizeSpec: dto.sizeSpec }),
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.intervalDays !== undefined && { intervalDays: dto.intervalDays }),
        ...(dto.lastReplacedAt !== undefined && {
          lastReplacedAt: dto.lastReplacedAt ? new Date(dto.lastReplacedAt) : null,
        }),
        ...(dto.purchaseUrl !== undefined && { purchaseUrl: dto.purchaseUrl }),
      },
    });
  }

  async markReplaced(companyId: string, id: string) {
    await this.assertOwned(companyId, id);
    return this.prisma.equipmentConsumable.update({
      where: { id },
      data: { lastReplacedAt: new Date() },
    });
  }

  async remove(companyId: string, id: string) {
    await this.assertOwned(companyId, id);
    await this.prisma.equipmentConsumable.delete({ where: { id } });
  }
}
