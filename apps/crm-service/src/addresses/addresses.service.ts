import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async findByCustomer(companyId: string, customerId: string) {
    return this.prisma.address.findMany({
      where: { companyId, customerId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findByLead(companyId: string, leadId: string) {
    return this.prisma.address.findMany({
      where: { companyId, leadId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(
    companyId: string,
    data: {
      customerId?: string;
      leadId?: string;
      type?: string;
      line1: string;
      line2?: string;
      city?: string;
      state?: string;
      postcode?: string;
      isPrimary?: boolean;
    },
  ) {
    return this.prisma.address.create({
      data: { ...data, companyId },
    });
  }

  async update(
    companyId: string,
    id: string,
    data: {
      type?: string;
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postcode?: string;
      isPrimary?: boolean;
    },
  ) {
    const addr = await this.prisma.address.findFirst({ where: { id, companyId } });
    if (!addr) throw new NotFoundException('Address not found');
    return this.prisma.address.update({ where: { id }, data });
  }

  async remove(companyId: string, id: string) {
    const addr = await this.prisma.address.findFirst({ where: { id, companyId } });
    if (!addr) throw new NotFoundException('Address not found');
    await this.prisma.address.delete({ where: { id } });
  }

  /** Bulk replace all addresses for a customer */
  async replaceForCustomer(
    companyId: string,
    customerId: string,
    addresses: Array<{
      id?: string;
      type?: string;
      line1: string;
      line2?: string;
      city?: string;
      state?: string;
      postcode?: string;
      isPrimary?: boolean;
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.address.deleteMany({ where: { companyId, customerId } });
      if (addresses.length === 0) return [];
      await tx.address.createMany({
        data: addresses.map((a) => ({
          companyId,
          customerId,
          type: a.type ?? 'Site',
          line1: a.line1,
          line2: a.line2,
          city: a.city,
          state: a.state,
          postcode: a.postcode,
          isPrimary: a.isPrimary ?? false,
        })),
      });
      return tx.address.findMany({
        where: { companyId, customerId },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      });
    });
  }

  /** Bulk replace all addresses for a lead */
  async replaceForLead(
    companyId: string,
    leadId: string,
    addresses: Array<{
      id?: string;
      type?: string;
      line1: string;
      line2?: string;
      city?: string;
      state?: string;
      postcode?: string;
      isPrimary?: boolean;
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.address.deleteMany({ where: { companyId, leadId } });
      if (addresses.length === 0) return [];
      await tx.address.createMany({
        data: addresses.map((a) => ({
          companyId,
          leadId,
          type: a.type ?? 'Site',
          line1: a.line1,
          line2: a.line2,
          city: a.city,
          state: a.state,
          postcode: a.postcode,
          isPrimary: a.isPrimary ?? false,
        })),
      });
      return tx.address.findMany({
        where: { companyId, leadId },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      });
    });
  }
}
