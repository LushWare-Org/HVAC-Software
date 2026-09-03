import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { ServiceClient } from '../../internal/service-client.service';

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
      status: 'PARTIALLY_PAID',
      total: '500.00',
      balanceDue: '340.50',
    },
    '/quotes/q-1': {
      id: 'q-1',
      customerId: 'cus-1',
      quoteNumber: 'Q-77',
      status: 'SENT',
      total: '1200.00',
    },
    '/invoices': {
      data: [
        { id: 'inv-1', invoiceNumber: 'INV-1001', status: 'PARTIALLY_PAID', total: '500.00', balanceDue: '340.50' },
        { id: 'inv-2', invoiceNumber: 'INV-1002', status: 'PAID', total: '120.00', balanceDue: '0.00' },
      ],
    },
    '/quotes': { data: [{ id: 'q-1', status: 'SENT', total: '1200.00' }] },
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
    post: jest.fn(async (): Promise<any> => ({ queued: true })),
    getBinary: jest.fn(async (): Promise<Buffer> => Buffer.from('%PDF-1.4 fake')),
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

describe('DocumentsService', () => {
  describe('reading', () => {
    it('sums what the caller still owes, ignoring settled invoices', async () => {
      const service = new DocumentsService(makeServices());
      const result = await service.listInvoices('co-1', 'cus-1', true);

      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0].id).toBe('inv-1');
      // Decimal strings must survive as real numbers.
      expect(result.totalOutstanding).toBe(340.5);
    });

    it('can include settled invoices when asked', async () => {
      const service = new DocumentsService(makeServices());
      const result = await service.listInvoices('co-1', 'cus-1', false);
      expect(result.invoices).toHaveLength(2);
      expect(result.totalOutstanding).toBe(340.5);
    });
  });

  describe('sending', () => {
    it('texts to the number on file, and never to a supplied one', async () => {
      const services = makeServices();
      const service = new DocumentsService(services);

      const result = await service.send('co-1', {
        customerId: 'cus-1',
        documentType: 'invoice',
        documentId: 'inv-1',
        channel: 'sms',
      });

      const [, path, , body] = services.post.mock.calls[0] as any[];
      expect(path).toBe('/notifications/sms');
      expect(body.recipientPhone).toBe('0771234567');
      // Masked in the response so it isn't read out in full on a call.
      expect(result.sentTo).toBe('••••4567');
    });

    it('emails with the PDF attached', async () => {
      const services = makeServices();
      const service = new DocumentsService(services);

      const result = await service.send('co-1', {
        customerId: 'cus-1',
        documentType: 'invoice',
        documentId: 'inv-1',
        channel: 'email',
      });

      const [, path, , body] = services.post.mock.calls[0] as any[];
      expect(path).toBe('/notifications/email');
      expect(body.recipientEmail).toBe('sarah.jones@example.test');
      expect(body.attachments?.[0].filename).toBe('invoice-INV-1001.pdf');
      expect(result.attachmentIncluded).toBe(true);
    });

    it('still sends the email when the PDF cannot be rendered', async () => {
      const services = makeServices();
      services.getBinary.mockRejectedValue(new Error('chromium busy'));
      const service = new DocumentsService(services);

      const result = await service.send('co-1', {
        customerId: 'cus-1',
        documentType: 'invoice',
        documentId: 'inv-1',
        channel: 'email',
      });

      expect(result.sent).toBe(true);
      expect(result.attachmentIncluded).toBe(false);
      const [, , , body] = services.post.mock.calls[0] as any[];
      expect(body.attachments).toBeUndefined();
    });

    // The core isolation guarantee: a real document id plus someone else's
    // customer id must not deliver one customer's invoice to another.
    it('refuses a document belonging to a different customer', async () => {
      const services = makeServices({
        '/customers/cus-2': { ...CUSTOMER, id: 'cus-2' },
      });
      const service = new DocumentsService(services);

      await expect(
        service.send('co-1', {
          customerId: 'cus-2',
          documentType: 'invoice',
          documentId: 'inv-1',
          channel: 'sms',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(services.post).not.toHaveBeenCalled();
    });

    it('asks for the other channel when no phone is on file', async () => {
      const services = makeServices({
        '/customers/cus-1': { ...CUSTOMER, phone: null, mobile: null },
      });
      const service = new DocumentsService(services);

      await expect(
        service.send('co-1', {
          customerId: 'cus-1',
          documentType: 'invoice',
          documentId: 'inv-1',
          channel: 'sms',
        }),
      ).rejects.toThrow(/offer email instead/);
    });

    it('reports an unknown document as not found', async () => {
      const service = new DocumentsService(makeServices());
      await expect(
        service.send('co-1', {
          customerId: 'cus-1',
          documentType: 'invoice',
          documentId: 'nope',
          channel: 'sms',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('booking confirmation', () => {
    it('does not call a pending booking confirmed', async () => {
      const services = makeServices({
        '/bookings': {
          data: [
            {
              id: 'bk-1',
              customerId: 'cus-1',
              status: 'PENDING',
              serviceType: 'AC repair',
              preferredDate: '2026-09-05T14:00:00.000Z',
            },
          ],
        },
      });
      const service = new DocumentsService(services);

      const result = await service.sendBookingConfirmation('co-1', 'bk-1', 'sms');

      const [, , , body] = services.post.mock.calls[0] as any[];
      expect(body.body).toContain('awaiting confirmation');
      expect(body.body).not.toContain('is confirmed');
      expect(result.bookingStatus).toBe('PENDING');
    });

    it('says confirmed once the office has confirmed it', async () => {
      const services = makeServices({
        '/bookings': {
          data: [
            {
              id: 'bk-1',
              customerId: 'cus-1',
              status: 'CONFIRMED',
              serviceType: 'AC repair',
              preferredDate: '2026-09-05T14:00:00.000Z',
            },
          ],
        },
      });
      const service = new DocumentsService(services);

      await service.sendBookingConfirmation('co-1', 'bk-1', 'sms');
      const [, , , body] = services.post.mock.calls[0] as any[];
      expect(body.body).toContain('is confirmed');
    });
  });
});

// Regression: a draft invoice has never been sent to the customer, so it must
// not appear in what an agent tells them they owe.
describe('DocumentsService — draft invoices', () => {
  it('excludes drafts from the outstanding balance', async () => {
    const services = makeServices({
      '/invoices': {
        data: [
          { id: 'inv-1', status: 'SENT', total: '340.50', balanceDue: '340.50' },
          { id: 'inv-2', status: 'DRAFT', total: '120.00', balanceDue: '120.00' },
          { id: 'inv-3', status: 'PAID', total: '80.00', balanceDue: '0.00' },
        ],
      },
    });
    const service = new DocumentsService(services);

    const open = await service.listInvoices('co-1', 'cus-1', true);
    expect(open.totalOutstanding).toBe(340.5);
    expect(open.invoices.map((i) => i.id)).toEqual(['inv-1']);

    // The draft is still visible when everything is requested…
    const all = await service.listInvoices('co-1', 'cus-1', false);
    expect(all.invoices).toHaveLength(3);
    // …but never counted as owed.
    expect(all.totalOutstanding).toBe(340.5);
  });
});
