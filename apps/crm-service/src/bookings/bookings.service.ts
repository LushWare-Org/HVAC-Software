import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { emitPartnerEvent, PartnerEventType } from '@tscrm/queue';
import { TtlCacheService } from '../cache/ttl-cache.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private ttlCache: TtlCacheService,
  ) {}

  async findAll(companyId: string, status?: string, limit?: number) {
    // Bounded by default — the dashboard only shows a handful of upcoming
    // appointments; fetching every booking ever made grows unbounded.
    const take = Number.isFinite(Number(limit)) && Number(limit) > 0
      ? Math.min(500, Math.trunc(Number(limit)))
      : 200;
    const data = await this.prisma.booking.findMany({
      where: { companyId, ...(status && { status: status as any }) },
      include: { customer: { select: { id: true, firstName: true, lastName: true, phone: true } } },
      orderBy: { preferredDate: 'asc' },
      take,
    });
    // Map to include customerName for frontend compatibility
    const mapped = data.map((b: any) => ({
      ...b,
      customerName: b.customer ? `${b.customer.firstName} ${b.customer.lastName}`.trim() : b.guestName || '',
      scheduledStart: b.preferredDate,
      scheduledEnd: b.alternateDate,
    }));
    return { data: mapped, meta: { total: mapped.length, page: 1, limit: mapped.length, totalPages: 1 } };
  }

  async create(companyId: string, data: {
    serviceType: string; description?: string; preferredDate: Date; alternateDate?: Date;
    customerId?: string; guestName?: string; guestEmail?: string; guestPhone?: string; notes?: string;
  }) {
    const booking = await this.prisma.booking.create({ data: { ...data, companyId } });

    if (data.customerId) {
      const linkedCustomer = await this.prisma.customer.findFirst({
        where: { id: data.customerId, companyId },
        select: { id: true, tags: true },
      });

      if (linkedCustomer) {
        await this.prisma.customer.update({
          where: { id: linkedCustomer.id },
          data: {
            engagementStatus: 'JOB_BOOKED',
            tags: { set: linkedCustomer.tags.filter((tag) => tag !== 'portal-signup') },
          },
        });
      }
    }

    // Bookings feed the customer status-summary (service cadence) — bust it.
    if (data.customerId) this.ttlCache.del(`status-summary:${companyId}:${data.customerId}`);
    return booking;
  }

  async confirm(companyId: string, id: string) {
    const booking = await this.prisma.booking.findFirst({ where: { id, companyId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId) this.ttlCache.del(`status-summary:${companyId}:${booking.customerId}`);
    const confirmed = await this.prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });

    void emitPartnerEvent({
      type: PartnerEventType.BOOKING_CONFIRMED,
      companyId,
      entityId: confirmed.id,
      occurredAt: new Date().toISOString(),
      data: {
        serviceType: confirmed.serviceType,
        customerId: confirmed.customerId,
        customerName: confirmed.guestName ?? undefined,
        scheduledFor: confirmed.preferredDate.toISOString(),
      },
    });

    return confirmed;
  }

  async reschedule(
    companyId: string,
    id: string,
    preferredDate: Date,
    reason?: string,
  ) {
    const booking = await this.prisma.booking.findFirst({ where: { id, companyId } });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status === 'CONVERTED') {
      throw new BadRequestException(
        'Booking has already been converted to a job — reschedule the job instead',
      );
    }
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Cannot reschedule a cancelled booking');
    }

    const note = [
      booking.notes,
      `Rescheduled from ${booking.preferredDate.toISOString()}${reason ? ` — ${reason}` : ''}`,
    ]
      .filter(Boolean)
      .join('\n');

    if (booking.customerId) this.ttlCache.del(`status-summary:${companyId}:${booking.customerId}`);

    return this.prisma.booking.update({
      where: { id },
      data: {
        preferredDate,
        notes: note,
        status: 'PENDING',
      },
    });
  }

  async cancel(companyId: string, id: string, reason?: string) {
    const booking = await this.prisma.booking.findFirst({ where: { id, companyId } });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status === 'CONVERTED') {
      throw new BadRequestException(
        'Booking has already been converted to a job — cancel the job instead',
      );
    }
    if (booking.status === 'CANCELLED') {
      return booking; // idempotent: cancelling twice is not an error
    }

    if (booking.customerId) this.ttlCache.del(`status-summary:${companyId}:${booking.customerId}`);

    return this.prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: [booking.notes, reason ? `Cancelled — ${reason}` : 'Cancelled']
          .filter(Boolean)
          .join('\n'),
      },
    });
  }

  async convert(companyId: string, id: string, jobId: string) {
    const booking = await this.prisma.booking.findFirst({ where: { id, companyId } });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.prisma.booking.update({ where: { id }, data: { status: 'CONVERTED', jobId } });
  }
}
