import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async findByCustomer(companyId: string, customerId: string) {
    // Verify customer belongs to this company
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    return this.prisma.contact.findMany({
      where: { customerId, companyId },
      orderBy: [{ isPrimary: 'desc' }, { firstName: 'asc' }],
    });
  }

  async create(
    companyId: string,
    customerId: string,
    data: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      role?: string;
      isPrimary?: boolean;
    },
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    // If setting as primary, unset current primary first
    if (data.isPrimary) {
      await this.prisma.contact.updateMany({
        where: { customerId, companyId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.contact.create({
      data: { ...data, customerId, companyId },
    });
  }

  async remove(companyId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, companyId },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return this.prisma.contact.delete({ where: { id } });
  }
}
