import { BadRequestException } from '@nestjs/common';
import { PartnerBookingsService, AI_AGENT_TAG } from './bookings.service';
import { ServiceClient } from '../../internal/service-client.service';
import { PrismaService } from '../../prisma/prisma.service';

function makeServices() {
  const client = {
    get: jest.fn(),
    // Loosely typed so tests can inspect any argument position and swap
    // implementations without fighting inferred tuple types.
    post: jest.fn(async (...args: any[]): Promise<any> => {
      const path = args[1];
      if (path === '/customers') return { id: 'cus-new' };
      if (path === '/leads') return { id: 'lead-new' };
      if (path === '/bookings') {
        return {
          id: 'bk-1',
          status: 'PENDING',
          serviceType: 'AC repair',
          preferredDate: '2026-09-05T02:30:00.000Z',
        };
      }
      throw new Error(`unexpected POST ${path}`);
    }),
    patch: jest.fn(async (...args: any[]): Promise<any> => ({
      id: 'bk-1',
      status: 'PENDING',
      preferredDate: '2026-09-06T02:30:00.000Z',
    })),
    optional: async <T>(_l: string, fn: () => Promise<T>, fb: T) => {
      try {
        return await fn();
      } catch {
        return fb;
      }
    },
  };
  return client as unknown as ServiceClient & typeof client;
}

function makePrisma(existingBookings = 0) {
  return {
    partnerNewCallerBooking: {
      count: jest.fn().mockResolvedValue(existingBookings),
      create: jest.fn().mockResolvedValue({}),
    },
  };
}

const NEW_CALLER = {
  serviceType: 'AC repair',
  preferredDate: '2026-09-05T02:30:00.000Z',
  firstName: 'Sarah',
  lastName: 'Jones',
  phone: '+94 77 123 4567',
  address: '12 Baker Street',
};

describe('PartnerBookingsService', () => {
  describe('existing customer', () => {
    it('books as PENDING and says confirmation is still needed', async () => {
      const services = makeServices();
      const prisma = makePrisma();
      const service = new PartnerBookingsService(
        services,
        prisma as unknown as PrismaService,
      );

      const result = await service.create('co-1', 'key-1', {
        customerId: 'cus-9',
        serviceType: 'AC repair',
        preferredDate: '2026-09-05T02:30:00.000Z',
      });

      expect(result.booking.status).toBe('PENDING');
      expect(result.requiresConfirmation).toBe(true);
      expect(result.createdCustomer).toBe(false);
      // No customer or lead invented for someone who already exists.
      expect(services.post).toHaveBeenCalledTimes(1);
      expect(prisma.partnerNewCallerBooking.create).not.toHaveBeenCalled();
    });
  });

  describe('first-time caller', () => {
    it('creates a customer and a lead, both tagged for staff review', async () => {
      const services = makeServices();
      const prisma = makePrisma();
      const service = new PartnerBookingsService(
        services,
        prisma as unknown as PrismaService,
      );

      const result = await service.create('co-1', 'key-1', NEW_CALLER);

      expect(result.createdCustomer).toBe(true);
      expect(result.customerId).toBe('cus-new');
      expect(result.requiresConfirmation).toBe(true);

      const customerCall = services.post.mock.calls.find((c) => c[1] === '/customers');
      expect(customerCall?.[3]).toMatchObject({ tags: [AI_AGENT_TAG] });

      expect(services.post.mock.calls.some((c) => c[1] === '/leads')).toBe(true);
      expect(prisma.partnerNewCallerBooking.create).toHaveBeenCalled();
    });

    it('refuses without a name or number, before writing anything', async () => {
      const services = makeServices();
      const prisma = makePrisma();
      const service = new PartnerBookingsService(
        services,
        prisma as unknown as PrismaService,
      );

      await expect(
        service.create('co-1', 'key-1', {
          serviceType: 'AC repair',
          preferredDate: '2026-09-05T02:30:00.000Z',
          firstName: 'Sarah',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(services.post).not.toHaveBeenCalled();
      expect(prisma.partnerNewCallerBooking.create).not.toHaveBeenCalled();
    });

    it('enforces the daily cap per number', async () => {
      const services = makeServices();
      const prisma = makePrisma(1); // already booked once today
      const service = new PartnerBookingsService(
        services,
        prisma as unknown as PrismaService,
      );

      await expect(service.create('co-1', 'key-1', NEW_CALLER)).rejects.toThrow(
        /already made 1 booking/,
      );
      expect(services.post).not.toHaveBeenCalled();
    });

    it('counts the cap on normalised trailing digits, not the raw string', async () => {
      const services = makeServices();
      const prisma = makePrisma();
      const service = new PartnerBookingsService(
        services,
        prisma as unknown as PrismaService,
      );

      await service.create('co-1', 'key-1', NEW_CALLER);

      expect(prisma.partnerNewCallerBooking.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ phoneSuffix: '771234567' }),
        }),
      );
    });

    it('still books when lead creation fails', async () => {
      const services = makeServices();
      services.post.mockImplementation(async (...args: any[]): Promise<any> => {
        const path = args[1];
        if (path === '/leads') throw new Error('leads down');
        if (path === '/customers') return { id: 'cus-new' };
        return { id: 'bk-1', status: 'PENDING' };
      });
      const service = new PartnerBookingsService(
        services,
        makePrisma() as unknown as PrismaService,
      );

      const result = await service.create('co-1', 'key-1', NEW_CALLER);
      expect(result.booking.id).toBe('bk-1');
    });
  });

  it('reschedules and reports that confirmation is needed again', async () => {
    const services = makeServices();
    const service = new PartnerBookingsService(
      services,
      makePrisma() as unknown as PrismaService,
    );

    const result = await service.reschedule('co-1', 'bk-1', '2026-09-06T02:30:00.000Z');

    expect(result.requiresConfirmation).toBe(true);
    expect(services.patch).toHaveBeenCalledWith(
      'crm',
      '/bookings/bk-1/reschedule',
      'co-1',
      expect.objectContaining({ preferredDate: '2026-09-06T02:30:00.000Z' }),
    );
  });

  it('cancels through the CRM cancel route', async () => {
    const services = makeServices();
    const service = new PartnerBookingsService(
      services,
      makePrisma() as unknown as PrismaService,
    );

    await service.cancel('co-1', 'bk-1', 'caller changed their mind');

    expect(services.patch).toHaveBeenCalledWith(
      'crm',
      '/bookings/bk-1/cancel',
      'co-1',
      { reason: 'caller changed their mind' },
    );
  });

  describe('availability', () => {
    it('asks the caller’s own company, and passes the paging window through', async () => {
      const services = makeServices();
      services.get.mockResolvedValue({ timezone: 'Asia/Colombo', capacityPerSlot: 4, slots: [] });
      const service = new PartnerBookingsService(
        services,
        makePrisma() as unknown as PrismaService,
      );

      await service.availability('co-1', 3, 7);

      expect(services.get).toHaveBeenCalledWith(
        'crm',
        '/bookings/availability',
        'co-1',
        { limit: 3, daysAhead: 7 },
      );
    });

    it('returns slot labels and capacity untouched', async () => {
      const upstream = {
        timezone: 'Asia/Colombo',
        capacityPerSlot: 4,
        slots: [
          {
            start: '2026-09-10T04:30:00.000Z',
            end: '2026-09-10T06:30:00.000Z',
            label: 'Thursday, Sep 10, 10 AM–12 PM',
            remainingCapacity: 3,
          },
        ],
      };
      const services = makeServices();
      services.get.mockResolvedValue(upstream);
      const service = new PartnerBookingsService(
        services,
        makePrisma() as unknown as PrismaService,
      );

      const result = await service.availability('co-1');

      expect(result).toEqual(upstream);
      // The spoken label must survive verbatim; the agent reads it out.
      expect((result as typeof upstream).slots[0].label).toBe(
        'Thursday, Sep 10, 10 AM–12 PM',
      );
    });

    it('lets an availability outage surface instead of offering no times as if none existed', async () => {
      const services = makeServices();
      services.get.mockRejectedValue(new Error('crm unreachable'));
      const service = new PartnerBookingsService(
        services,
        makePrisma() as unknown as PrismaService,
      );

      // An empty slot list would make the agent say "we have nothing free",
      // which is a different and worse lie than "I can't check right now".
      await expect(service.availability('co-1')).rejects.toThrow('crm unreachable');
    });
  });
});
