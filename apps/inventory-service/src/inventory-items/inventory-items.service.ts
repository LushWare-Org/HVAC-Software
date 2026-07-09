import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LocationsService } from '../locations/locations.service';
import { ItemCategory } from '../prisma/generated';
import { clampPagination } from '@tscrm/types';

@Injectable()
export class InventoryItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locations: LocationsService,
  ) {}

  async findAll(companyId: string, pageInput: number | string = 1, limitInput: number | string = 50, search?: string, category?: string, priceBookItemId?: string) {
    const { page, limit, skip } = clampPagination({ page: pageInput, limit: limitInput }, { defaultLimit: 50 });
    const where: any = { companyId, isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (priceBookItemId) where.priceBookItemId = priceBookItemId;

    const [data, count] = await this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({
        where,
        include: { stockLevels: { include: { location: true } } },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return { data, count, page, limit };
  }

  async findOne(companyId: string, id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, companyId },
      include: { stockLevels: { include: { location: true } } },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async create(companyId: string, dto: {
    sku: string;
    name: string;
    description?: string;
    category: ItemCategory;
    unit?: string;
    priceBookItemId?: string;
    reorderPoint?: number;
    reorderQty?: number;
    unitCost?: number;
  }) {
    // Ensure warehouse exists for this company
    const warehouse = await this.locations.ensureWarehouse(companyId);

    const item = await this.prisma.inventoryItem.create({
      data: {
        companyId,
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        unit: dto.unit ?? 'each',
        priceBookItemId: dto.priceBookItemId,
        reorderPoint: dto.reorderPoint ?? 5,
        reorderQty: dto.reorderQty ?? 10,
        unitCost: dto.unitCost,
      },
    });

    // Auto-create a stock level row at the warehouse (qty=0)
    await this.prisma.stockLevel.create({
      data: { inventoryItemId: item.id, locationId: warehouse.id, quantity: 0, reservedQty: 0 },
    });

    return this.findOne(companyId, item.id);
  }

  async update(companyId: string, id: string, dto: {
    name?: string;
    description?: string;
    unit?: string;
    reorderPoint?: number;
    reorderQty?: number;
    priceBookItemId?: string;
    unitCost?: number;
    isActive?: boolean;
  }) {
    await this.findOne(companyId, id); // verify exists
    return this.prisma.inventoryItem.update({
      where: { id },
      data: dto,
      include: { stockLevels: { include: { location: true } } },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStockLevels(companyId: string, itemId: string) {
    await this.findOne(companyId, itemId);
    return this.prisma.stockLevel.findMany({
      where: { inventoryItemId: itemId },
      include: { location: true },
    });
  }
}
