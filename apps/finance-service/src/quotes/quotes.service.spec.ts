/**
 * QuotesService — Unit Tests
 *
 * Strategy:
 *  - Prisma is mocked with jest.fn() — no database required
 *  - ConfigService is mocked with jest.fn()
 *  - Each test verifies business logic (state transitions, totals, token generation)
 *    independently of persistence
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QuotesService } from './quotes.service';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { NotificationClientService } from '../notification-client/notification-client.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { PrismaClientKnownRequestError } from '../prisma/generated/runtime/library';
import { QuoteStatus } from '../prisma/generated';

// ── Helpers ───────────────────────────────────────────────────────────────

function makeDecimal(n: number) {
  return { toString: () => String(n) } as any;
}

const COMPANY_ID = 'company-001';
const USER_ID = 'user-001';
const QUOTE_ID = 'quote-001';

function makeQuote(overrides: Partial<any> = {}): any {
  return {
    id: QUOTE_ID,
    companyId: COMPANY_ID,
    quoteNumber: 'QUOTE-2024-0001',
    customerId: 'cust-001',
    customerName: 'Test Corp',
    customerEmail: 'test@corp.com',
    title: 'Test Quote',
    status: QuoteStatus.DRAFT,
    subtotal: makeDecimal(1000),
    discountAmount: makeDecimal(0),
    discountValue: null,
    discountType: null,
    taxRate: makeDecimal(0.0825),
    taxAmount: makeDecimal(82.5),
    total: makeDecimal(1082.5),
    createdAt: new Date(),
    lineItems: [],
    ...overrides,
  };
}

// ── Mock PrismaService ────────────────────────────────────────────────────

const mockPrisma: any = {
  quote: {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  quoteLineItem: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  invoice: {
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  // Invoice numbers come from MAX(existing), not count() — see invoice-number.ts.
  $queryRaw: jest.fn().mockResolvedValue([{ maxNumber: 0 }]),
  $executeRawUnsafe: jest.fn().mockResolvedValue(0),
  // Second arg is the timeout/maxWait options object; ignore it but accept it,
  // otherwise a callback+options call silently does nothing.
  $transaction: jest.fn((args: any, _opts?: any) => {
    if (Array.isArray(args)) return Promise.all(args);
    return args(mockPrisma); // callback form
  }),
};

// ── Test Suite ────────────────────────────────────────────────────────────

describe('QuotesService', () => {
  let service: QuotesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('') } },
        { provide: PdfService, useValue: { generateQuotePdf: jest.fn().mockResolvedValue(Buffer.from('pdf')), generateInvoicePdf: jest.fn().mockResolvedValue(Buffer.from('pdf')) } },
        { provide: NotificationClientService, useValue: { sendEmail: jest.fn().mockResolvedValue(undefined), sendSms: jest.fn().mockResolvedValue(undefined) } },
        { provide: CompanySettingsClient, useValue: { getSettings: jest.fn().mockResolvedValue({ id: 'company-001', name: 'Demo', logoUrl: null, currency: 'USD', timezone: 'America/New_York', features: {} }) } },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
  });

  // ── findOne ─────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the quote when found', async () => {
      const q = makeQuote();
      mockPrisma.quote.findFirst.mockResolvedValue(q);
      const result = await service.findOne(COMPANY_ID, QUOTE_ID);
      expect(result).toEqual(q);
      expect(mockPrisma.quote.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: QUOTE_ID, companyId: COMPANY_ID } }),
      );
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.quote.findFirst.mockResolvedValue(null);
      await expect(service.findOne(COMPANY_ID, 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('calculates correct subtotal, taxAmount, and total', async () => {
      mockPrisma.quote.count.mockResolvedValue(0);
      mockPrisma.quote.create.mockImplementation(({ data }: any) => Promise.resolve({ ...data, id: QUOTE_ID }));

      const dto = {
        customerId: 'cust-001',
        customerName: 'Test Corp',
        customerEmail: 'test@corp.com',
        title: 'Test Quote',
        taxRate: 0.1, // 10%
        lineItems: [
          { description: 'Labour', quantity: 2, unitPrice: 100, taxable: true },
          { description: 'Parts', quantity: 1, unitPrice: 50, taxable: true },
        ],
      };

      await service.create(COMPANY_ID, USER_ID, dto);

      const call = mockPrisma.quote.create.mock.calls[0][0];
      expect(call.data.subtotal).toBe(250);      // 2×100 + 1×50
      expect(call.data.taxAmount).toBeCloseTo(25);  // 250×0.10
      expect(call.data.total).toBeCloseTo(275);     // 250+25
    });

    it('applies percentage discount correctly', async () => {
      mockPrisma.quote.count.mockResolvedValue(1);
      mockPrisma.quote.create.mockImplementation(({ data }: any) => Promise.resolve({ ...data, id: QUOTE_ID }));

      const dto = {
        customerId: 'cust-001',
        customerName: 'Test Corp',
        customerEmail: 'test@corp.com',
        title: 'Discounted Quote',
        taxRate: 0,
        discountType: 'PERCENTAGE' as any,
        discountValue: 10, // 10% off
        lineItems: [{ description: 'Work', quantity: 1, unitPrice: 200, taxable: true }],
      };

      await service.create(COMPANY_ID, USER_ID, dto);
      const call = mockPrisma.quote.create.mock.calls[0][0];
      expect(call.data.discountAmount).toBe(20); // 10% of 200
      expect(call.data.total).toBe(180);          // 200 - 20
    });

    it('generates sequential quote numbers', async () => {
      mockPrisma.quote.count.mockResolvedValue(5);
      mockPrisma.quote.create.mockImplementation(({ data }: any) => Promise.resolve({ ...data, id: QUOTE_ID }));

      await service.create(COMPANY_ID, USER_ID, {
        customerId: 'c', customerName: 'X', customerEmail: 'x@x.com', title: 'T',
      });

      const call = mockPrisma.quote.create.mock.calls[0][0];
      expect(call.data.quoteNumber).toMatch(/QUOTE-\d{4}-0006/);
    });
  });

  // ── send ────────────────────────────────────────────────────────────────

  describe('send', () => {
    it('sets status to SENT and generates an approvalToken', async () => {
      const q = makeQuote({ status: QuoteStatus.DRAFT });
      mockPrisma.quote.findFirst.mockResolvedValue(q);
      mockPrisma.quote.update.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...q, ...data }),
      );

      const result = await service.send(COMPANY_ID, QUOTE_ID);

      const updateCall = mockPrisma.quote.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe(QuoteStatus.SENT);
      expect(updateCall.data.approvalToken).toBeTruthy();
      expect(updateCall.data.approvalToken).toHaveLength(36); // UUID v4
    });

    it('throws BadRequestException if quote is DECLINED/EXPIRED/CONVERTED', async () => {
      mockPrisma.quote.findFirst.mockResolvedValue(makeQuote({ status: QuoteStatus.CONVERTED }));
      await expect(service.send(COMPANY_ID, QUOTE_ID)).rejects.toThrow(BadRequestException);
    });

    it('re-sends an already SENT quote (resend support)', async () => {
      mockPrisma.quote.findFirst.mockResolvedValue(makeQuote({ status: QuoteStatus.SENT, approvalToken: 'tok-1' }));
      mockPrisma.quote.update.mockResolvedValue(makeQuote({ status: QuoteStatus.SENT, approvalToken: 'tok-1', sentAt: new Date() }));
      const result = await service.send(COMPANY_ID, QUOTE_ID);
      expect(result.status).toBe(QuoteStatus.SENT);
      expect(mockPrisma.quote.update).toHaveBeenCalled();
    });
  });

  // ── approve ─────────────────────────────────────────────────────────────

  describe('approve', () => {
    it('approves a VIEWED quote and captures approver info', async () => {
      const token = 'tok-abc-123';
      const q = makeQuote({ status: QuoteStatus.VIEWED, approvalToken: token });
      mockPrisma.quote.findUnique.mockResolvedValue(q);
      mockPrisma.quote.update.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...q, ...data }),
      );

      const result = await service.approve(token, 'Jane Doe', 'jane@doe.com');
      const updateCall = mockPrisma.quote.update.mock.calls[0][0];

      expect(updateCall.data.status).toBe(QuoteStatus.ACCEPTED);
      expect(updateCall.data.approvedByName).toBe('Jane Doe');
      expect(updateCall.data.approvedByEmail).toBe('jane@doe.com');
      expect(updateCall.data.approvedAt).toBeInstanceOf(Date);
    });

    it('throws NotFoundException for unknown token', async () => {
      mockPrisma.quote.findUnique.mockResolvedValue(null);
      await expect(service.approve('bad-token', 'X', 'x@x.com')).rejects.toThrow(NotFoundException);
    });

    it('is idempotent if already ACCEPTED', async () => {
      const token = 'tok-abc-123';
      const q = makeQuote({ status: QuoteStatus.ACCEPTED, approvalToken: token });
      mockPrisma.quote.findUnique.mockResolvedValue(q);

      const result = await service.approve(token, 'Jane', 'jane@x.com');
      expect(mockPrisma.quote.update).not.toHaveBeenCalled();
    });
  });

  // ── update (status transitions) ──────────────────────────────────────────

  describe('update — status transitions', () => {
    it('allows DRAFT → SENT', async () => {
      const q = makeQuote({ status: QuoteStatus.DRAFT });
      mockPrisma.quote.findFirst.mockResolvedValue(q);
      mockPrisma.quote.update.mockResolvedValue({ ...q, status: QuoteStatus.SENT });

      await service.update(COMPANY_ID, QUOTE_ID, { status: QuoteStatus.SENT });
      expect(mockPrisma.quote.update).toHaveBeenCalled();
    });

    it('rejects DRAFT → ACCEPTED (invalid transition)', async () => {
      mockPrisma.quote.findFirst.mockResolvedValue(makeQuote({ status: QuoteStatus.DRAFT }));
      await expect(
        service.update(COMPANY_ID, QUOTE_ID, { status: QuoteStatus.ACCEPTED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects any transition from ACCEPTED (terminal state)', async () => {
      mockPrisma.quote.findFirst.mockResolvedValue(makeQuote({ status: QuoteStatus.ACCEPTED }));
      await expect(
        service.update(COMPANY_ID, QUOTE_ID, { status: QuoteStatus.SENT }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── convertToInvoice ─────────────────────────────────────────────────────

  describe('convertToInvoice', () => {
    it('creates an invoice from an ACCEPTED quote', async () => {
      const q = makeQuote({ status: QuoteStatus.ACCEPTED });
      mockPrisma.quote.findFirst.mockResolvedValue(q);
      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'inv-001' }),
      );

      await service.convertToInvoice(COMPANY_ID, QUOTE_ID, USER_ID);

      const createCall = mockPrisma.invoice.create.mock.calls[0][0];
      expect(createCall.data.quoteId).toBe(QUOTE_ID);
      expect(createCall.data.companyId).toBe(COMPANY_ID);
      expect(createCall.data.invoiceNumber).toMatch(/INV-\d{4}-0001/);
      expect(mockPrisma.quote.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: QUOTE_ID },
        data: { status: QuoteStatus.CONVERTED },
      }));
    });

    // ── The reported production failure ─────────────────────────────────────
    // "Transaction API error: Transaction not found ... refers to an old closed
    // transaction" — Prisma's default 5s interactive-transaction budget expired
    // between the invoice create and the quote update, because the transaction
    // also carried a 3-way include fetch and a cross-schema raw UPDATE while
    // talking to a remote Postgres. These guard the shape that fixed it.

    it('sets an explicit transaction timeout rather than inheriting the 5s default', async () => {
      const q = makeQuote({ status: QuoteStatus.ACCEPTED });
      mockPrisma.quote.findFirst.mockResolvedValue(q);
      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'inv-001' }),
      );

      await service.convertToInvoice(COMPANY_ID, QUOTE_ID, USER_ID);

      const opts = mockPrisma.$transaction.mock.calls[0][1];
      expect(opts?.timeout).toBeGreaterThanOrEqual(15_000);
      expect(opts?.maxWait).toBeGreaterThan(0);
    });

    it('keeps the heavy include fetch OUT of the transaction', async () => {
      const q = makeQuote({ status: QuoteStatus.ACCEPTED });
      mockPrisma.quote.findFirst.mockResolvedValue(q);
      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'inv-001' }),
      );

      await service.convertToInvoice(COMPANY_ID, QUOTE_ID, USER_ID);

      // Inside the transaction the create selects only the id…
      expect(mockPrisma.invoice.create.mock.calls[0][0].select).toEqual({ id: true });
      expect(mockPrisma.invoice.create.mock.calls[0][0].include).toBeUndefined();
      // …and the full shape is read afterwards.
      expect(mockPrisma.invoice.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'inv-001' } }),
      );
    });

    it('runs the cross-schema estimate backfill after commit, not inside', async () => {
      const q = makeQuote({ status: QuoteStatus.ACCEPTED, jobId: 'job-1' });
      mockPrisma.quote.findFirst.mockResolvedValue(q);
      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'inv-001' }),
      );

      await service.convertToInvoice(COMPANY_ID, QUOTE_ID, USER_ID);

      // It still happens — just on the client, after the transaction closed.
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
      const sql = String(mockPrisma.$executeRawUnsafe.mock.calls[0][0]);
      expect(sql).toContain('jobs"."jobs"');
      expect(sql).toContain('estimatedValue');
    });

    it('still returns the invoice when the estimate backfill fails', async () => {
      const q = makeQuote({ status: QuoteStatus.ACCEPTED, jobId: 'job-1' });
      mockPrisma.quote.findFirst.mockResolvedValue(q);
      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'inv-001' }),
      );
      mockPrisma.$executeRawUnsafe.mockRejectedValueOnce(new Error('jobs schema unreachable'));
      mockPrisma.invoice.findUniqueOrThrow.mockResolvedValue({ id: 'inv-001' });

      // Best-effort means best-effort: a conversion the user was told succeeded
      // must not fail because a denormalised estimate could not be written.
      await expect(service.convertToInvoice(COMPANY_ID, QUOTE_ID, USER_ID))
        .resolves.toEqual(expect.objectContaining({ id: 'inv-001' }));
    });

    it('retries with a fresh number when two conversions collide', async () => {
      const q = makeQuote({ status: QuoteStatus.ACCEPTED });
      mockPrisma.quote.findFirst.mockResolvedValue(q);
      mockPrisma.invoice.findFirst.mockResolvedValue(null);

      const collision: any = new Error('Unique constraint failed');
      collision.code = 'P2002';
      collision.meta = { target: ['companyId', 'invoiceNumber'] };
      Object.setPrototypeOf(collision, PrismaClientKnownRequestError.prototype);

      mockPrisma.invoice.create
        .mockRejectedValueOnce(collision)
        .mockImplementation(({ data }: any) => Promise.resolve({ ...data, id: 'inv-002' }));
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ maxNumber: 4 }])   // first try -> 0005
        .mockResolvedValueOnce([{ maxNumber: 5 }]);  // retry re-reads -> 0006

      await service.convertToInvoice(COMPANY_ID, QUOTE_ID, USER_ID);

      expect(mockPrisma.invoice.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.invoice.create.mock.calls[1][0].data.invoiceNumber)
        .toMatch(/^INV-\d{4}-0006$/);
    });

    it('throws if quote is not ACCEPTED', async () => {
      mockPrisma.quote.findFirst.mockResolvedValue(makeQuote({ status: QuoteStatus.SENT }));
      await expect(
        service.convertToInvoice(COMPANY_ID, QUOTE_ID, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws if invoice already exists for this quote', async () => {
      mockPrisma.quote.findFirst.mockResolvedValue(makeQuote({ status: QuoteStatus.ACCEPTED }));
      mockPrisma.invoice.findFirst.mockResolvedValue({ id: 'inv-existing', invoiceNumber: 'INV-2024-0001' });
      await expect(
        service.convertToInvoice(COMPANY_ID, QUOTE_ID, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes a DRAFT quote', async () => {
      mockPrisma.quote.findFirst.mockResolvedValue(makeQuote({ status: QuoteStatus.DRAFT }));
      mockPrisma.quote.delete.mockResolvedValue({});
      await service.remove(COMPANY_ID, QUOTE_ID);
      expect(mockPrisma.quote.delete).toHaveBeenCalledWith({ where: { id: QUOTE_ID } });
    });

    it('throws BadRequestException for non-DRAFT quote', async () => {
      mockPrisma.quote.findFirst.mockResolvedValue(makeQuote({ status: QuoteStatus.SENT }));
      await expect(service.remove(COMPANY_ID, QUOTE_ID)).rejects.toThrow(BadRequestException);
    });
  });
});
