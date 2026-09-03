import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ServiceClient } from '../../internal/service-client.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

/** Marks every record an AI phone agent created, so staff can spot-check them. */
export const AI_AGENT_TAG = 'ai-phone-agent';
export const AI_AGENT_SOURCE = 'AI phone agent';
const DEFAULT_NEW_CALLER_DAILY_LIMIT = 1;

@Injectable()
export class PartnerBookingsService {
  private readonly logger = new Logger(PartnerBookingsService.name);

  constructor(
    private readonly services: ServiceClient,
    private readonly prisma: PrismaService,
  ) {}

  availability(companyId: string, limit?: number, daysAhead?: number) {
    return this.services.get('crm', '/bookings/availability', companyId, {
      limit,
      daysAhead,
    });
  }

  async create(companyId: string, keyId: string, dto: CreateBookingDto) {
    let customerId = dto.customerId;
    let createdCustomer = false;

    if (!customerId) {
      const caller = this.requireNewCallerDetails(dto);
      await this.assertNewCallerUnderDailyLimit(companyId, caller.phone);
      customerId = await this.createCallerRecords(companyId, dto, caller);
      createdCustomer = true;
    }

    const booking = await this.services.post<any>('crm', '/bookings', companyId, {
      customerId,
      serviceType: dto.serviceType,
      description: dto.description,
      preferredDate: dto.preferredDate,
      notes: this.bookingNote(dto, keyId),
    });

    return {
      booking: {
        id: booking.id,
        status: booking.status,
        serviceType: booking.serviceType,
        preferredDate: booking.preferredDate,
      },
      customerId,
      createdCustomer,
      // Say this plainly so the agent tells the caller the truth.
      requiresConfirmation: true,
      message:
        'Booking received and awaiting confirmation. The office will confirm shortly.',
    };
  }

  async reschedule(
    companyId: string,
    bookingId: string,
    preferredDate: string,
    reason?: string,
  ) {
    const booking = await this.services.patch<any>(
      'crm',
      `/bookings/${bookingId}/reschedule`,
      companyId,
      { preferredDate, reason },
    );
    return {
      booking: { id: booking.id, status: booking.status, preferredDate: booking.preferredDate },
      requiresConfirmation: true,
    };
  }

  async cancel(companyId: string, bookingId: string, reason?: string) {
    const booking = await this.services.patch<any>(
      'crm',
      `/bookings/${bookingId}/cancel`,
      companyId,
      { reason },
    );
    return { booking: { id: booking.id, status: booking.status } };
  }

  // ------------------------------------------------------------------
  // New caller handling
  // ------------------------------------------------------------------

  /**
   * A first-time caller needs a name and a number before anything is written —
   * a nameless customer record is worse than no record.
   */
  private requireNewCallerDetails(dto: CreateBookingDto): {
    firstName: string;
    lastName: string;
    phone: string;
  } {
    const missing = (['firstName', 'lastName', 'phone'] as const).filter(
      (field) => !dto[field]?.trim(),
    );
    if (missing.length) {
      throw new BadRequestException(
        `A first-time caller needs ${missing.join(', ')}. ` +
          'Supply customerId instead for an existing customer.',
      );
    }
    return {
      firstName: dto.firstName!.trim(),
      lastName: dto.lastName!.trim(),
      phone: dto.phone!.trim(),
    };
  }

  /**
   * Counts bookings this key already made today for the same number. The
   * partner call log is the source of truth we own — it cannot be evaded by
   * the partner, and it doesn't depend on CRM data shape.
   */
  private async assertNewCallerUnderDailyLimit(companyId: string, phone: string) {
    const limit = Number(
      process.env.PARTNER_NEW_CALLER_DAILY_LIMIT ?? DEFAULT_NEW_CALLER_DAILY_LIMIT,
    );
    if (limit <= 0) return;

    const since = new Date(Date.now() - 24 * 3_600_000);
    const digits = phone.replace(/\D/g, '').slice(-9);

    const used = await this.prisma.partnerNewCallerBooking.count({
      where: { companyId, phoneSuffix: digits, createdAt: { gte: since } },
    });

    if (used >= limit) {
      throw new BadRequestException(
        `This number has already made ${used} booking(s) in the last 24 hours. ` +
          'Please have the office call back to arrange another.',
      );
    }
  }

  private async createCallerRecords(
    companyId: string,
    dto: CreateBookingDto,
    caller: { firstName: string; lastName: string; phone: string },
  ): Promise<string> {
    const customer = await this.services.post<any>('crm', '/customers', companyId, {
      firstName: caller.firstName,
      lastName: caller.lastName,
      phone: caller.phone,
      email: dto.email,
      address: dto.address,
      city: dto.city,
      zipCode: dto.zipCode,
      source: AI_AGENT_SOURCE,
      tags: [AI_AGENT_TAG],
      notes: 'Created automatically from an inbound phone call. Details are caller-reported and unverified.',
    });

    // A lead alongside the customer, matching the self-service signup flow so
    // the office reviews new callers where it already reviews new signups.
    await this.services.optional(
      'lead creation',
      () =>
        this.services.post('crm', '/leads', companyId, {
          firstName: caller.firstName,
          lastName: caller.lastName,
          phone: caller.phone,
          email: dto.email,
          source: AI_AGENT_SOURCE,
          serviceInterest: dto.serviceType,
          notes: dto.description,
        }),
      null,
    );

    await this.prisma.partnerNewCallerBooking.create({
      data: {
        companyId,
        phoneSuffix: caller.phone.replace(/\D/g, '').slice(-9),
        customerId: customer.id,
      },
    });

    this.logger.log(`Created customer ${customer.id} for a new caller (company ${companyId})`);
    return customer.id;
  }

  private bookingNote(dto: CreateBookingDto, keyId: string): string {
    return [
      `Booked by AI phone agent (key ${keyId}).`,
      dto.address ? `Caller-reported address: ${dto.address}` : null,
      dto.description ? `Reported issue: ${dto.description}` : null,
      'Details are caller-reported and unverified — confirm before dispatch.',
    ]
      .filter(Boolean)
      .join('\n');
  }
}
