import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponse } from '@tscrm/types';

@Injectable()
export class PriceBookService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    companyId: string,
    page = 1,
    limit = 50,
    search?: string,
    category?: string,
  ): Promise<PaginatedResponse<unknown>> {
    const skip = (page - 1) * limit;
    const where = {
      companyId,
      isActive: true,
      ...(category && { category: category as any }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.priceBookItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.priceBookItem.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const item = await this.prisma.priceBookItem.findFirst({
      where: { id, companyId },
    });
    if (!item) throw new NotFoundException(`Price book item ${id} not found`);
    return item;
  }

  async create(
    companyId: string,
    data: {
      category: string;
      code?: string;
      name: string;
      description?: string;
      unit?: string;
      unitPrice: number;
      taxable?: boolean;
      jobTypeId?: string;
    },
  ) {
    return this.prisma.priceBookItem.create({
      data: { ...data, companyId, category: data.category as any, unitPrice: data.unitPrice },
    });
  }

  async update(
    companyId: string,
    id: string,
    data: Partial<{
      name: string;
      description: string;
      unit: string;
      unitPrice: number;
      taxable: boolean;
      isActive: boolean;
    }>,
  ) {
    await this.findOne(companyId, id);
    return this.prisma.priceBookItem.update({ where: { id }, data });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.priceBookItem.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Used by work-orders service when adding line items
  async findByIds(companyId: string, ids: string[]) {
    return this.prisma.priceBookItem.findMany({
      where: { companyId, id: { in: ids }, isActive: true },
    });
  }
}
