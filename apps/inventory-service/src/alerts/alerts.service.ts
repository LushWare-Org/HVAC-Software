import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LocationType } from '../prisma/generated';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLowStockItems(companyId: string) {
    // Find warehouse location
    const warehouse = await this.prisma.stockLocation.findFirst({
      where: { companyId, type: LocationType.WAREHOUSE },
    });
    if (!warehouse) return [];

    // Get all active items with their warehouse stock level
    const items = await this.prisma.inventoryItem.findMany({
      where: { companyId, isActive: true },
      include: {
        stockLevels: {
          where: { locationId: warehouse.id },
        },
      },
    });

    return items
      .filter((item) => {
        const warehouseQty = item.stockLevels[0] ? Number(item.stockLevels[0].quantity) : 0;
        return warehouseQty < item.reorderPoint;
      })
      .map((item) => {
        const currentQty = item.stockLevels[0] ? Number(item.stockLevels[0].quantity) : 0;
        return {
          inventoryItemId: item.id,
          itemName: item.name,
          sku: item.sku,
          category: item.category,
          currentQty,
          reorderPoint: item.reorderPoint,
          reorderQty: item.reorderQty,
          deficit: item.reorderPoint - currentQty,
        };
      })
      .sort((a, b) => b.deficit - a.deficit);
  }
}
