import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async findByCustomer(companyId: string, customerId: string) {
    return this.prisma.equipment.findMany({
      where: { companyId, customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    companyId: string,
    customerId: string,
    data: {
      type?: string;
      brand?: string;
      model?: string;
      serialNo?: string;
      installDate?: string;
      warrantyEnd?: string;
      notes?: string;
    },
  ) {
    return this.prisma.equipment.create({
      data: {
        companyId,
        customerId,
        type: data.type ?? 'Boiler',
        brand: data.brand,
        model: data.model,
        serialNo: data.serialNo,
        installDate: data.installDate ? new Date(data.installDate) : undefined,
        warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : undefined,
        notes: data.notes,
      },
    });
  }

  async update(
    companyId: string,
    id: string,
    data: {
      type?: string;
      brand?: string;
      model?: string;
      serialNo?: string;
      installDate?: string;
      warrantyEnd?: string;
      notes?: string;
    },
  ) {
    const eq = await this.prisma.equipment.findFirst({ where: { id, companyId } });
    if (!eq) throw new NotFoundException('Equipment not found');
    return this.prisma.equipment.update({
      where: { id },
      data: {
        ...data,
        installDate: data.installDate ? new Date(data.installDate) : undefined,
        warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : undefined,
      },
    });
  }

  async remove(companyId: string, id: string) {
    const eq = await this.prisma.equipment.findFirst({ where: { id, companyId } });
    if (!eq) throw new NotFoundException('Equipment not found');
    await this.prisma.equipment.delete({ where: { id } });
  }

  /** Bulk replace all equipment for a customer */
  async replaceForCustomer(
    companyId: string,
    customerId: string,
    items: Array<{
      id?: string;
      type?: string;
      brand?: string;
      model?: string;
      serialNo?: string;
      installDate?: string;
      warrantyEnd?: string;
      notes?: string;
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.equipment.deleteMany({ where: { companyId, customerId } });
      if (items.length === 0) return [];
      await tx.equipment.createMany({
        data: items.map((eq) => ({
          companyId,
          customerId,
          type: eq.type ?? 'Boiler',
          brand: eq.brand,
          model: eq.model,
          serialNo: eq.serialNo,
          installDate: eq.installDate ? new Date(eq.installDate) : null,
          warrantyEnd: eq.warrantyEnd ? new Date(eq.warrantyEnd) : null,
          notes: eq.notes,
        })),
      });
      return tx.equipment.findMany({
        where: { companyId, customerId },
        orderBy: { createdAt: 'desc' },
      });
    });
  }
}
