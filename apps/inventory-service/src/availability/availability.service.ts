import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LocationType } from '../prisma/generated';

interface ItemRequest { inventoryItemId: string; qty: number; }

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAvailability(companyId: string, items: ItemRequest[], technicianId?: string) {
    // Find warehouse
    const warehouse = await this.prisma.stockLocation.findFirst({
      where: { companyId, type: LocationType.WAREHOUSE },
    });

    // Find van if technicianId provided
    let van: any = null;
    if (technicianId) {
      van = await this.prisma.stockLocation.findFirst({
        where: { companyId, technicianId },
      });
    }

    const results = await Promise.all(items.map(async (req) => {
      const item = await this.prisma.inventoryItem.findUnique({
        where: { id: req.inventoryItemId },
        select: { name: true },
      });

      let vanAvailable = 0;
      let warehouseAvailable = 0;

      if (van) {
        const vanLevel = await this.prisma.stockLevel.findUnique({
          where: { inventoryItemId_locationId: { inventoryItemId: req.inventoryItemId, locationId: van.id } },
        });
        if (vanLevel) vanAvailable = Math.max(0, Number(vanLevel.quantity) - Number(vanLevel.reservedQty));
      }

      if (warehouse) {
        const whLevel = await this.prisma.stockLevel.findUnique({
          where: { inventoryItemId_locationId: { inventoryItemId: req.inventoryItemId, locationId: warehouse.id } },
        });
        if (whLevel) warehouseAvailable = Math.max(0, Number(whLevel.quantity) - Number(whLevel.reservedQty));
      }

      let score: number;
      if (vanAvailable >= req.qty) score = 1.0;
      else if (warehouseAvailable >= req.qty) score = 0.5;
      else score = 0.0;

      return {
        inventoryItemId: req.inventoryItemId,
        name: item?.name ?? 'Unknown',
        requestedQty: req.qty,
        vanAvailable,
        warehouseAvailable,
        score,
      };
    }));

    const partsScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length
      : 1.0;

    return { partsScore, items: results };
  }
}
