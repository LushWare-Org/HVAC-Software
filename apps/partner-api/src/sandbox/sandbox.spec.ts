import { BadRequestException } from '@nestjs/common';
import { DocumentsService } from '../v1/documents/documents.service';
import { PaymentsService } from '../v1/payments/payments.service';
import { ServiceClient } from '../internal/service-client.service';
import { PrismaService } from '../prisma/prisma.service';
import { isSandbox } from './sandbox';

const CUSTOMER = {
  id: 'cus-1',
  firstName: 'Sarah',
  lastName: 'Jones',
  email: 'sarah@example.test',
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
      return routes[path];
    }),
    post: jest.fn(async (): Promise<any> => ({ ok: true })),
    getBinary: jest.fn(async (): Promise<Buffer> => Buffer.from('%PDF')),
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

const noPrisma = {
  partnerNewCallerBooking: { count: jest.fn().mockResolvedValue(0) },
} as unknown as PrismaService;

describe('sandbox mode', () => {
  it('identifies sandbox keys', () => {
    expect(isSandbox({ environment: 'SANDBOX' })).toBe(true);
    expect(isSandbox({ environment: 'LIVE' })).toBe(false);
  });

  describe('documents', () => {
    it('does not text a real number', async () => {
      const services = makeServices();
      const service = new DocumentsService(services);

      const result = await service.send(
        'co-1',
        { customerId: 'cus-1', documentType: 'invoice', documentId: 'inv-1', channel: 'sms' },
        true,
      );

      expect(result.simulated).toBe(true);
      expect(result.notice).toMatch(/nothing was actually sent/);
      // The decisive assertion: comms was never called.
      expect(services.post).not.toHaveBeenCalled();
    });

    it('does not email a real address, or render a PDF', async () => {
      const services = makeServices();
      const service = new DocumentsService(services);

      const result = await service.send(
        'co-1',
        { customerId: 'cus-1', documentType: 'invoice', documentId: 'inv-1', channel: 'email' },
        true,
      );

      expect(result.simulated).toBe(true);
      expect(services.post).not.toHaveBeenCalled();
      expect(services.getBinary).not.toHaveBeenCalled();
    });

    // Sandbox must not be a way to skip validation, or an integrator's tests
    // would pass against rules that reject them in production.
    it('still enforces ownership', async () => {
      const services = makeServices({ '/customers/cus-2': { ...CUSTOMER, id: 'cus-2' } });
      const service = new DocumentsService(services);

      await expect(
        service.send(
          'co-1',
          { customerId: 'cus-2', documentType: 'invoice', documentId: 'inv-1', channel: 'sms' },
          true,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('still fails when no phone is on file', async () => {
      const services = makeServices({
        '/customers/cus-1': { ...CUSTOMER, phone: null, mobile: null },
      });
      const service = new DocumentsService(services);

      await expect(
        service.send(
          'co-1',
          { customerId: 'cus-1', documentType: 'invoice', documentId: 'inv-1', channel: 'sms' },
          true,
        ),
      ).rejects.toThrow(/offer email instead/);
    });
  });

  describe('payments', () => {
    it('returns an unpayable link and never calls Stripe', async () => {
      const services = makeServices();
      const service = new PaymentsService(services, noPrisma);

      const result = await service.createLink(
        'co-1',
        { customerId: 'cus-1', invoiceId: 'inv-1' },
        true,
      );

      expect(result.simulated).toBe(true);
      expect(result.paymentUrl).toContain('sandbox.invalid');
      expect(result.paymentUrl).not.toContain('stripe');
      expect(result.amountDue).toBe(340.5);
      expect(services.post).not.toHaveBeenCalled();
    });

    it('still refuses a draft invoice', async () => {
      const services = makeServices({
        '/invoices/inv-1': {
          id: 'inv-1',
          customerId: 'cus-1',
          status: 'DRAFT',
          balanceDue: '340.50',
        },
      });
      const service = new PaymentsService(services, noPrisma);

      await expect(
        service.createLink('co-1', { customerId: 'cus-1', invoiceId: 'inv-1' }, true),
      ).rejects.toThrow(/has not been issued/);
    });
  });
});
