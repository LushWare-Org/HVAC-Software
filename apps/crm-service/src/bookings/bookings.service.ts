import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, status?: string) {
    return this.prisma.booking.findMany({
      where: { companyId, ...(status && { status: status as any }) },
      include: { customer: { select: { id: true, firstName: true, lastName: true, phone: true } } },
      orderBy: { preferredDate: 'asc' },
    });
  }

  async create(companyId: string, data: {
    serviceType: string; description?: string; preferredDate: Date; alternateDate?: Date;
    customerId?: string; guestName?: string; guestEmail?: string; guestPhone?: string; notes?: string;
  }) {
    return this.prisma.booking.create({ data: { ...data, companyId } });
  }

  async confirm(companyId: string, id: string) {
    const booking = await this.prisma.booking.findFirst({ where: { id, companyId } });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.prisma.booking.update({ where: { id }, data: { status: 'CONFIRMED' } });
  }

  async convert(companyId: string, id: string, jobId: string) {
    const booking = await this.prisma.booking.findFirst({ where: { id, companyId } });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.prisma.booking.update({ where: { id }, data: { status: 'CONVERTED', jobId } });
  }
}
