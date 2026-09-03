import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ServiceClient } from '../../internal/service-client.service';
import { PrismaService } from '../../prisma/prisma.service';

const CUSTOMER = {
  id: 'cus-1',
  firstName: 'Sarah',
  lastName: 'Jones',
  email: 'sarah.jones@example.test',
  phone: '0771234567',
  mobile: null,
};

function makeServices(overrides: Record<string, any> = {}) {
  const routes: Record<string, any> = {
    '/customers/cus-1': CUSTOMER,
    '/invoices/inv-1': {
      id: 'inv-1',
      customerId: 'cus-1',
      invoiceNumber: 'INV-1001',
      status: 'SENT',
      total: '500.00',
      balanceDue: '340.50',
    },
    ...overrides,
  };

  const client = {
    get: jest.fn(async (...args: any[]): Promise<any> => {
      const path = args[1];
      if (!(path in routes)) throw new Error(`unexpected GET ${path}`);
      const v = routes[path];
      if (v instanceof Error) throw v;
      return v;
    }),
    post: jest.fn(async (...args: any[]): Promise<any> => {
      const path = args[1];
      if (path.endsWith('/payment-intent')) {
        return { paymentUrl: 'https://checkout.stripe.com/c/pay/cs_test_123' };
      }
      return { queued: true };
    }),
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

function makePrisma(recentAgentCustomers = 0) {
  return {
    partnerNewCallerBooking: {
      count: jest.fn().mockResolvedValue(recentAgentCustomers),
    },
  };
}

describe('PaymentsService', () => {
  it('creates a link for an issued, unpaid invoice', async () => {
    const services = makeServices();
    const service = new PaymentsService(
      services,
      makePrisma() as unknown as PrismaService,
    );

    const result = await service.createLink('co-1', {
      customerId: 'cus-1',
      invoiceId: 'inv-1',
    });

    expect(result.paymentUrl).toContain('checkout.stripe.com');
    expect(result.amountDue).toBe(340.5);
    expect(result.invoiceNumber).toBe('INV-1001');
    // Not sent anywhere unless asked.
    expect(result.sentTo).toBeUndefined();
  });

  it('texts the link to the number on file when asked', async () => {
    const services = makeServices();
    const service = new PaymentsService(
      services,
      makePrisma() as unknown as PrismaService,
    );

    const result = await service.createLink('co-1', {
      customerId: 'cus-1',
      invoiceId: 'inv-1',
      send: 'sms',
    });

    const smsCall = services.post.mock.calls.find(
      (c: any[]) => c[1] === '/notifications/sms',
    ) as any[];
    expect(smsCall[3].recipientPhone).toBe('0771234567');
    expect(smsCall[3].body).toContain('checkout.stripe.com');
    expect(result.sentTo).toBe('••••4567');
  });

  // The rule from the plan: no payment links for a caller the agent just invented.
  it('refuses a customer the agent created on this call', async () => {
    const services = makeServices();
    const service = new PaymentsService(
      services,
      makePrisma(1) as unknown as PrismaService,
    );

    await expect(
      service.createLink('co-1', { customerId: 'cus-1', invoiceId: 'inv-1' }),
    ).rejects.toThrow(/created on this call/);

    expect(services.post).not.toHaveBeenCalled();
  });

  it('refuses a draft invoice — not yet issued to the customer', async () => {
    const services = makeServices({
      '/invoices/inv-1': {
        id: 'inv-1',
        customerId: 'cus-1',
        status: 'DRAFT',
        balanceDue: '340.50',
      },
    });
    const service = new PaymentsService(
      services,
      makePrisma() as unknown as PrismaService,
    );

    await expect(
      service.createLink('co-1', { customerId: 'cus-1', invoiceId: 'inv-1' }),
    ).rejects.toThrow(/has not been issued/);
  });

  it('refuses an already paid invoice', async () => {
    const services = makeServices({
      '/invoices/inv-1': {
        id: 'inv-1',
        customerId: 'cus-1',
        invoiceNumber: 'INV-1001',
        status: 'PAID',
        balanceDue: '0.00',
      },
    });
    const service = new PaymentsService(
      services,
      makePrisma() as unknown as PrismaService,
    );

    await expect(
      service.createLink('co-1', { customerId: 'cus-1', invoiceId: 'inv-1' }),
    ).rejects.toThrow(/already paid/);
  });

  it('refuses an invoice belonging to another customer', async () => {
    const services = makeServices({
      '/customers/cus-2': { ...CUSTOMER, id: 'cus-2' },
    });
    const service = new PaymentsService(
      services,
      makePrisma() as unknown as PrismaService,
    );

    await expect(
      service.createLink('co-1', { customerId: 'cus-2', invoiceId: 'inv-1' }),
    ).rejects.toThrow(BadRequestException);
    expect(services.post).not.toHaveBeenCalled();
  });

  it('refuses a zero balance', async () => {
    const services = makeServices({
      '/invoices/inv-1': {
        id: 'inv-1',
        customerId: 'cus-1',
        status: 'SENT',
        balanceDue: '0.00',
        total: '0.00',
      },
    });
    const service = new PaymentsService(
      services,
      makePrisma() as unknown as PrismaService,
    );

    await expect(
      service.createLink('co-1', { customerId: 'cus-1', invoiceId: 'inv-1' }),
    ).rejects.toThrow(/no balance due/);
  });

  it('explains plainly when online payments are switched off', async () => {
    const services = makeServices();
    services.post.mockRejectedValue({ response: { status: 403 } });
    const service = new PaymentsService(
      services,
      makePrisma() as unknown as PrismaService,
    );

    await expect(
      service.createLink('co-1', { customerId: 'cus-1', invoiceId: 'inv-1' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('reports an unknown invoice as not found', async () => {
    const service = new PaymentsService(
      makeServices(),
      makePrisma() as unknown as PrismaService,
    );
    await expect(
      service.createLink('co-1', { customerId: 'cus-1', invoiceId: 'nope' }),
    ).rejects.toThrow(NotFoundException);
  });
});
