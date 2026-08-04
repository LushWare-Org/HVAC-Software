/**
 * InvoicesService — Unit Tests
 *
 * Mocks: PrismaService (no DB), ConfigService, Stripe (no network)
 * Covers: create, status transitions, manual payment recording, overdue marking
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { NotificationClientService } from '../notification-client/notification-client.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { DocumentTemplateClient } from '../document-templates/document-template.client';
import { InvoiceStatus, PaymentStatus } from '../prisma/generated';

// ── Mock Stripe ───────────────────────────────────────────────────────────

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: 'pi_test', client_secret: 'cs_test', latest_charge: null }),
      retrieve: jest.fn().mockResolvedValue({ id: 'pi_test', client_secret: 'cs_test' }),
    },
    paymentLinks: {
      create: jest.fn().mockResolvedValue({ url: 'https://pay.stripe.com/test' }),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

// ── Helpers ───────────────────────────────────────────────────────────────

function makeDecimal(n: number) {
  return { toString: () => String(n) } as any;
}

const COMPANY_ID = 'company-001';
const USER_ID = 'user-001';
const INV_ID = 'inv-001';

function makeInvoice(overrides: Partial<any> = {}): any {
  return {
    id: INV_ID,
    companyId: COMPANY_ID,
    invoiceNumber: 'INV-2024-0001',
    customerId: 'cust-001',
    customerName: 'Test Corp',
    customerEmail: 'test@corp.com',
    status: InvoiceStatus.DRAFT,
    subtotal: makeDecimal(1000),
    discountAmount: makeDecimal(0),
    taxRate: makeDecimal(0.0825),
    taxAmount: makeDecimal(82.5),
    total: makeDecimal(1082.5),
    amountPaid: makeDecimal(0),
    balanceDue: makeDecimal(1082.5),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    lineItems: [],
    payments: [],
    quote: null,
    recurringSchedule: null,
    stripePaymentIntentId: null,
    stripePaymentUrl: null,
    ...overrides,
  };
}

// ── Mock PrismaService ────────────────────────────────────────────────────

const mockPrisma = {
  invoice: {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
  $transaction: jest.fn((args: any) => {
    if (Array.isArray(args)) return Promise.all(args);
    return args(); // for callback form
  }),
};

// ── Suite ─────────────────────────────────────────────────────────────────

const mockPdfService = {
  generateInvoicePdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  generateQuotePdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  generatePaymentReceiptPdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
};
const mockNotificationClient = { sendEmail: jest.fn().mockResolvedValue(undefined), sendSms: jest.fn().mockResolvedValue(undefined) };
const mockSettingsClient = {
  getSettings: jest.fn().mockResolvedValue({
    id: 'company-001', name: 'Demo', logoUrl: null,
    currency: 'USD', timezone: 'America/New_York', features: {},
  }),
};
const mockDocumentTemplateClient = { resolve: jest.fn().mockResolvedValue(null) };

describe('InvoicesService', () => {
  let service: InvoicesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSettingsClient.getSettings.mockResolvedValue({
      id: 'company-001', name: 'Demo', logoUrl: null,
      currency: 'USD', timezone: 'America/New_York', features: {},
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PdfService, useValue: mockPdfService },
        { provide: NotificationClientService, useValue: mockNotificationClient },
        { provide: CompanySettingsClient, useValue: mockSettingsClient },
        { provide: DocumentTemplateClient, useValue: mockDocumentTemplateClient },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'stripe.secretKey') return 'sk_test_fake';
              if (key === 'stripe.webhookSecret') return 'whsec_fake';
              return '';
            },
          },
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  // ── findOne ─────────────────────────────────────────────────────────────

  describe('createPaymentIntent feature gate', () => {
    it('is forbidden when onlinePayments is off', async () => {
      mockSettingsClient.getSettings.mockResolvedValue({
        id: COMPANY_ID, name: 'KASE', logoUrl: null,
        currency: 'LKR', timezone: 'Asia/Colombo',
        features: { onlinePayments: false },
      });
      await expect(service.createPaymentIntent(COMPANY_ID, INV_ID))
        .rejects.toThrow(ForbiddenException);
      expect(mockPrisma.invoice.findFirst).not.toHaveBeenCalled();
    });

    it('proceeds past the gate when features empty', async () => {
      mockSettingsClient.getSettings.mockResolvedValue({
        id: COMPANY_ID, name: 'Demo', logoUrl: null,
        currency: 'USD', timezone: 'America/New_York', features: {},
      });
      // Invoice is PAID so the method throws BadRequest AFTER the gate —
      // proving the gate let it through without needing full Stripe mocks.
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: InvoiceStatus.PAID }));
      await expect(service.createPaymentIntent(COMPANY_ID, INV_ID))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('returns invoice when found', async () => {
      const inv = makeInvoice();
      mockPrisma.invoice.findFirst.mockResolvedValue(inv);
      const result = await service.findOne(COMPANY_ID, INV_ID);
      expect(result).toEqual(inv);
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      await expect(service.findOne(COMPANY_ID, 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('calculates totals correctly and generates invoice number', async () => {
      mockPrisma.invoice.count.mockResolvedValue(2);
      mockPrisma.invoice.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: INV_ID }),
      );

      const dto = {
        customerId: 'c', customerName: 'C', customerEmail: 'c@c.com',
        taxRate: 0.1,
        lineItems: [
          { description: 'A', quantity: 3, unitPrice: 50, taxable: true },
        ],
      };

      await service.create(COMPANY_ID, USER_ID, dto);

      const callData = mockPrisma.invoice.create.mock.calls[0][0].data;
      expect(callData.subtotal).toBe(150);       // 3 × 50
      expect(callData.taxAmount).toBeCloseTo(15); // 150 × 0.10
      expect(callData.total).toBeCloseTo(165);    // 150 + 15
      expect(callData.balanceDue).toBeCloseTo(165);
      expect(callData.invoiceNumber).toMatch(/INV-\d{4}-0003/);
    });
  });

  // ── send ────────────────────────────────────────────────────────────────

  describe('send', () => {
    it('marks DRAFT invoice as SENT', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: InvoiceStatus.DRAFT }));
      mockPrisma.invoice.update.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...makeInvoice(), ...data }),
      );

      await service.send(COMPANY_ID, INV_ID);
      const updateCall = mockPrisma.invoice.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe(InvoiceStatus.SENT);
      expect(updateCall.data.sentAt).toBeInstanceOf(Date);
    });

    it('allows re-sending a SENT invoice (resend support)', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: InvoiceStatus.SENT }));
      mockPrisma.invoice.update.mockResolvedValue(makeInvoice({ status: InvoiceStatus.SENT, sentAt: new Date() }));
      await expect(service.send(COMPANY_ID, INV_ID)).resolves.toBeDefined();
    });

    it('throws if invoice is VOID', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: InvoiceStatus.VOID }));
      await expect(service.send(COMPANY_ID, INV_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ── updateStatus transitions ──────────────────────────────────────────

  describe('updateStatus', () => {
    const cases: Array<[InvoiceStatus, InvoiceStatus, boolean]> = [
      [InvoiceStatus.DRAFT, InvoiceStatus.SENT, true],
      [InvoiceStatus.SENT, InvoiceStatus.PAID, true],
      [InvoiceStatus.SENT, InvoiceStatus.OVERDUE, true],
      [InvoiceStatus.PAID, InvoiceStatus.VOID, false],      // terminal
      [InvoiceStatus.DRAFT, InvoiceStatus.PAID, false],     // skip a step
      [InvoiceStatus.VOID, InvoiceStatus.SENT, false],      // terminal
    ];

    test.each(cases)(
      'transition %s → %s allowed=%s',
      async (from: InvoiceStatus, to: InvoiceStatus, allowed: boolean) => {
        mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: from }));
        mockPrisma.invoice.update.mockResolvedValue({ ...makeInvoice(), status: to });

        if (allowed) {
          await expect(service.updateStatus(COMPANY_ID, INV_ID, to)).resolves.toBeDefined();
        } else {
          await expect(service.updateStatus(COMPANY_ID, INV_ID, to)).rejects.toThrow(BadRequestException);
        }
      },
    );
  });

  // ── recordManualPayment ───────────────────────────────────────────────

  describe('recordManualPayment', () => {
    it('marks invoice as PAID when full amount is recorded', async () => {
      const inv = makeInvoice({
        status: InvoiceStatus.SENT,
        total: makeDecimal(500),
        amountPaid: makeDecimal(0),
        balanceDue: makeDecimal(500),
      });
      mockPrisma.invoice.findFirst.mockResolvedValue(inv);
      mockPrisma.payment.create.mockResolvedValue({});
      mockPrisma.invoice.update.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation((ops: any[]) => Promise.all(ops));

      await service.recordManualPayment(COMPANY_ID, INV_ID, 500, 'CASH');

      const updateOp = mockPrisma.invoice.update.mock.calls[0][0];
      expect(updateOp.data.status).toBe(InvoiceStatus.PAID);
      expect(updateOp.data.amountPaid).toBe(500);
      expect(updateOp.data.balanceDue).toBe(0);
    });

    it('marks invoice as PARTIALLY_PAID for partial payment', async () => {
      const inv = makeInvoice({
        status: InvoiceStatus.SENT,
        total: makeDecimal(500),
        amountPaid: makeDecimal(0),
        balanceDue: makeDecimal(500),
      });
      mockPrisma.invoice.findFirst.mockResolvedValue(inv);
      mockPrisma.payment.create.mockResolvedValue({});
      mockPrisma.invoice.update.mockResolvedValue({});

      await service.recordManualPayment(COMPANY_ID, INV_ID, 200, 'CHECK');

      const updateOp = mockPrisma.invoice.update.mock.calls[0][0];
      expect(updateOp.data.status).toBe(InvoiceStatus.PARTIALLY_PAID);
      expect(updateOp.data.amountPaid).toBe(200);
      expect(updateOp.data.balanceDue).toBe(300);
    });

    it('throws if invoice is PAID', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: InvoiceStatus.PAID }));
      await expect(
        service.recordManualPayment(COMPANY_ID, INV_ID, 100, 'CARD'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── markOverdueInvoices ──────────────────────────────────────────────

  describe('markOverdueInvoices', () => {
    it('calls updateMany with correct filter', async () => {
      mockPrisma.invoice.updateMany.mockResolvedValue({ count: 3 });
      const result = await service.markOverdueInvoices();

      expect(result.count).toBe(3);
      const call = mockPrisma.invoice.updateMany.mock.calls[0][0];
      expect(call.where.status.in).toContain(InvoiceStatus.SENT);
      expect(call.where.status.in).toContain(InvoiceStatus.PARTIALLY_PAID);
      expect(call.data.status).toBe(InvoiceStatus.OVERDUE);
    });
  });

  // ── voidInvoice ──────────────────────────────────────────────────────

  describe('voidInvoice', () => {
    it('voids a SENT invoice', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: InvoiceStatus.SENT }));
      mockPrisma.invoice.update.mockResolvedValue({ ...makeInvoice(), status: InvoiceStatus.VOID });

      await service.voidInvoice(COMPANY_ID, INV_ID);
      const call = mockPrisma.invoice.update.mock.calls[0][0];
      expect(call.data.status).toBe(InvoiceStatus.VOID);
    });

    it('throws when trying to void a PAID invoice', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: InvoiceStatus.PAID }));
      await expect(service.voidInvoice(COMPANY_ID, INV_ID)).rejects.toThrow(BadRequestException);
    });
  });
});
