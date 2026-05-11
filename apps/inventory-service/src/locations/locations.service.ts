import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LocationType } from '../prisma/generated';
import { clampPagination } from '@tscrm/types';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.stockLocation.findMany({
      where: { companyId, isActive: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async getLocationStock(companyId: string, locationId: string, pageInput: number | string = 1, limitInput: number | string = 50, search?: string) {
    const { page, limit, skip } = clampPagination({ page: pageInput, limit: limitInput }, { defaultLimit: 50 });
    const location = await this.prisma.stockLocation.findFirst({ where: { id: locationId, companyId } });
    if (!location) throw new NotFoundException('Location not found');

    const where: any = { locationId };
    if (search) {
      where.inventoryItem = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [data, count] = await this.prisma.$transaction([
      this.prisma.stockLevel.findMany({
        where,
        include: { inventoryItem: true },
        skip,
        take: limit,
        orderBy: { inventoryItem: { name: 'asc' } },
      }),
      this.prisma.stockLevel.count({ where }),
    ]);

    return { data, count, page, limit };
  }

  async ensureWarehouse(companyId: string) {
    const existing = await this.prisma.stockLocation.findFirst({
      where: { companyId, type: LocationType.WAREHOUSE },
    });
    if (existing) return existing;
    return this.prisma.stockLocation.create({
      data: { companyId, type: LocationType.WAREHOUSE, name: 'Main Warehouse' },
    });
  }

  async ensureVan(companyId: string, technicianId: string, technicianName: string) {
    const existing = await this.prisma.stockLocation.findFirst({
      where: { companyId, technicianId },
    });
    if (existing) return existing;
    return this.prisma.stockLocation.create({
      data: { companyId, type: LocationType.VAN, name: `Van — ${technicianName}`, technicianId },
    });
  }
}
