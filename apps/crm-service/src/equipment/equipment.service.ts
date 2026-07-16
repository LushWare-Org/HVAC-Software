import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async findByHouse(companyId: string, houseId: string) {
    return this.prisma.equipment.findMany({
      where: { companyId, houseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Add equipment to a House (Housing Scheme template). Requires the house to
   * already have an owner assigned — customerId is derived from house.ownerCustomerId
   * and kept required/non-null, avoiding a nullable-customerId migration. See
   * docs/superpowers/specs/2026-07-13-project-templates-housing-scheme-design.md.
   */
  async createForHouse(
    companyId: string,
    houseId: string,
    data: {
      type?: string; brand?: string; model?: string; serialNo?: string;
      installDate?: string; warrantyEnd?: string; notes?: string;
    },
  ) {
    const house = await this.prisma.house.findFirst({ where: { id: houseId, companyId } });
    if (!house) throw new NotFoundException('House not found');
    if (!house.ownerCustomerId) {
      throw new BadRequestException('Assign an owner to this house before adding equipment');
    }
    return this.prisma.equipment.create({
      data: {
        companyId,
        customerId: house.ownerCustomerId,
        houseId,
        type: data.type ?? 'Thermostat',
        brand: data.brand,
        model: data.model,
        serialNo: data.serialNo,
        installDate: data.installDate ? new Date(data.installDate) : undefined,
        warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : undefined,
        notes: data.notes,
      },
    });
  }

  /**
   * Re-point customerId on all of a house's equipment when its owner changes.
   * House.ownerCustomerId is authoritative; Equipment.customerId is a denormalized
   * mirror kept in sync here so the portal's "My Equipment" (queried by customerId)
   * never shows a house's equipment to the wrong owner.
   */
  async resyncHouseEquipmentOwner(companyId: string, houseId: string, customerId: string) {
    await this.prisma.equipment.updateMany({
      where: { companyId, houseId },
      data: { customerId },
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
      manualUrl?: string;
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
        manualUrl: data.manualUrl,
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
      manualUrl?: string;
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

  /**
   * Returns all equipment with their customer joined, for automation scanning.
   * Filters: active customers only, equipment with installDate or warrantyEnd set.
   * Called by comms-service marketing automation worker.
   */
  async findAutomationCandidates(companyId: string) {
    return this.prisma.equipment.findMany({
      where: {
        companyId,
        customer: { isActive: true },
        OR: [
          { installDate: { not: null } },
          { warrantyEnd: { not: null } },
          { consumables: { some: {} } },
        ],
      },
      include: {
        consumables: true,
        customer: {
          select: {
            id: true,
            companyId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            mobile: true,
            zipCode: true,
            state: true,
            isActive: true,
          },
        },
      },
    });
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
      manualUrl?: string;
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
          manualUrl: eq.manualUrl,
        })),
      });
      return tx.equipment.findMany({
        where: { companyId, customerId },
        orderBy: { createdAt: 'desc' },
      });
    });
  }
}
