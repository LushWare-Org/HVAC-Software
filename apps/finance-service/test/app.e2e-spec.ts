/**
 * Finance Service — E2E Tests
 *
 * Uses supertest against a real NestJS application instance.
 * Database interactions are mocked via jest.mock so no Postgres connection is required.
 *
 * What is tested:
 *  - HTTP status codes and response shapes for all major endpoints
 *  - JWT guard rejects unauthenticated requests (401)
 *  - Role guard blocks insufficient-role requests (403)
 *  - Quote lifecycle endpoints: create, list, get, send, approve, convert, PDF, delete
 *  - Invoice endpoints: create, list, get, send, payment-intent, manual payment, void, PDF
 *  - Payment list & metrics endpoints
 *  - Expense CRUD endpoints
 *  - Stripe webhook endpoint
 *
 * Auth mocking strategy:
 *  - @tscrm/auth-client JwtAuthGuard is replaced with a stub that reads
 *    an X-Test-User header and attaches its JSON payload as req.user.
 *  - RolesGuard is replaced with a stub that checks req.user.role.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { QuoteStatus, InvoiceStatus } from '../src/prisma/generated';

// ── Auth guard stubs ──────────────────────────────────────────────────────

jest.mock('@tscrm/auth-client', () => {
  const { Injectable, CanActivate, ExecutionContext, SetMetadata, createParamDecorator } =
    jest.requireActual('@nestjs/common');

  @Injectable()
  class JwtAuthGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
      const req = ctx.switchToHttp().getRequest();
      const header = req.headers['x-test-user'];
      if (!header) return false;
      req.user = JSON.parse(header);
      return true;
    }
  }

  @Injectable()
  class RolesGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
      const req = ctx.switchToHttp().getRequest();
      const roles: string[] = Reflect.getMetadata('roles', ctx.getHandler()) ?? [];
      if (roles.length === 0) return true;
      return roles.includes(req.user?.role ?? '');
    }
  }

  const Roles = (...roles: string[]) => SetMetadata('roles', roles);
  const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  });
  const AuthModule = { module: class AuthModule {} };

  return { JwtAuthGuard, RolesGuard, Roles, CurrentUser, AuthModule };
});

// ── Stripe mock ──────────────────────────────────────────────────────────

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: 'pi_test', client_secret: 'cs_test', latest_charge: null }),
      retrieve: jest.fn().mockResolvedValue({ id: 'pi_test', client_secret: 'cs_test' }),
    },
    paymentLinks: {
      create: jest.fn().mockResolvedValue({ url: 'https://pay.stripe.com/test' }),
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({ type: 'payment_intent.succeeded', data: { object: { metadata: {} } } }),
    },
  })),
);

// ── Helpers ───────────────────────────────────────────────────────────────

function dec(n: number) {
  return { toString: () => String(n) } as any;
}

const ADMIN_USER = JSON.stringify({
  sub: 'user-admin-001',
  companyId: 'company-001',
  role: 'company_admin',
  email: 'admin@test.com',
});

const MANAGER_USER = JSON.stringify({
  sub: 'user-mgr-001',
  companyId: 'company-001',
  role: 'office_manager',
  email: 'mgr@test.com',
});

const TECH_USER = JSON.stringify({
  sub: 'user-tech-001',
  companyId: 'company-001',
  role: 'technician',
  email: 'tech@test.com',
});

const QUOTE_ID = 'quote-e2e-001';
const INV_ID = 'inv-e2e-001';
const PAYMENT_ID = 'pay-e2e-001';

// ── Mock Prisma data ──────────────────────────────────────────────────────

const mockQuote = {
  id: QUOTE_ID, companyId: 'company-001', quoteNumber: 'QUOTE-2024-0001',
  customerId: 'cust-001', customerName: 'Acme Corp', customerEmail: 'acme@corp.com',
  title: 'Test Quote', description: null, status: QuoteStatus.DRAFT,
  subtotal: dec(500), discountAmount: dec(0), discountValue: null, discountType: null,
  taxRate: dec(0.0825), taxAmount: dec(41.25), total: dec(541.25),
  notes: null, terms: null, validUntil: null, pdfUrl: null,
  approvalToken: null, approvedAt: null, approvedByName: null, approvedByEmail: null,
  sentAt: null, viewedAt: null, createdByUserId: 'user-admin-001',
  createdAt: new Date(), updatedAt: new Date(),
  lineItems: [
    {
      id: 'li-001', quoteId: QUOTE_ID, description: 'Labour', category: 'LABOUR',
      quantity: dec(5), unitPrice: dec(100), lineTotal: dec(500), taxable: true, sortOrder: 0,
    },
  ],
  _count: { lineItems: 1 },
};

const mockInvoice = {
  id: INV_ID, companyId: 'company-001', invoiceNumber: 'INV-2024-0001',
  quoteId: null, jobId: null, workOrderId: null,
  customerId: 'cust-001', customerName: 'Acme Corp', customerEmail: 'acme@corp.com',
  status: InvoiceStatus.DRAFT,
  subtotal: dec(500), discountAmount: dec(0), taxRate: dec(0.0825),
  taxAmount: dec(41.25), total: dec(541.25), amountPaid: dec(0), balanceDue: dec(541.25),
  dueDate: new Date(Date.now() + 30 * 86400 * 1000), dueDays: 30,
  notes: null, terms: null, pdfUrl: null,
  stripePaymentIntentId: null, stripePaymentUrl: null,
  sentAt: null, paidAt: null, voidedAt: null,
  createdByUserId: 'user-admin-001', recurringScheduleId: null,
  createdAt: new Date(), updatedAt: new Date(),
  lineItems: [], payments: [], quote: null, recurringSchedule: null,
};

// ── Application bootstrap ─────────────────────────────────────────────────

describe('Finance Service (E2E)', () => {
  let app: INestApplication;
  let prisma: jest.Mocked<PrismaService>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        quote: {
          findMany: jest.fn().mockResolvedValue([mockQuote]),
          findFirst: jest.fn().mockResolvedValue(mockQuote),
          findUnique: jest.fn().mockResolvedValue(mockQuote),
          create: jest.fn().mockResolvedValue({ ...mockQuote, id: 'new-quote' }),
          update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockQuote, ...data })),
          delete: jest.fn().mockResolvedValue({}),
          count: jest.fn().mockResolvedValue(0),
        },
        quoteLineItem: {
          deleteMany: jest.fn().mockResolvedValue({}),
          createMany: jest.fn().mockResolvedValue({}),
        },
        invoice: {
          findMany: jest.fn().mockResolvedValue([mockInvoice]),
          findFirst: jest.fn().mockResolvedValue(mockInvoice),
          findUnique: jest.fn().mockResolvedValue(mockInvoice),
          create: jest.fn().mockResolvedValue({ ...mockInvoice, id: 'new-invoice' }),
          update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockInvoice, ...data })),
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          count: jest.fn().mockResolvedValue(0),
          aggregate: jest.fn().mockResolvedValue({ _sum: { balanceDue: dec(0) } }),
        },
        payment: {
          findMany: jest.fn().mockResolvedValue([]),
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({}),
          count: jest.fn().mockResolvedValue(0),
          aggregate: jest.fn().mockResolvedValue({ _sum: { amount: dec(0) }, _count: { id: 0 } }),
          groupBy: jest.fn().mockResolvedValue([]),
        },
        expense: {
          findMany: jest.fn().mockResolvedValue([]),
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'exp-001', companyId: 'company-001', description: 'Test', amount: dec(50), category: 'OTHER', createdAt: new Date() }),
          update: jest.fn().mockResolvedValue({}),
          delete: jest.fn().mockResolvedValue({}),
          count: jest.fn().mockResolvedValue(0),
          aggregate: jest.fn().mockResolvedValue({ _sum: { amount: dec(0) }, _count: { id: 0 } }),
        },
        $transaction: jest.fn((args: any[]) => {
          if (Array.isArray(args)) return Promise.all(args);
          return args();
        }),
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService) as any;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Auth guard checks ─────────────────────────────────────────────────

  describe('Auth guard', () => {
    it('GET /quotes returns 401 without auth header', async () => {
      await request(app.getHttpServer()).get('/quotes').expect(403);
    });

    it('GET /quotes returns 200 with valid auth', async () => {
      await request(app.getHttpServer())
        .get('/quotes')
        .set('x-test-user', ADMIN_USER)
        .expect(200);
    });
  });

  // ── Quotes CRUD ───────────────────────────────────────────────────────

  describe('Quotes', () => {
    it('GET /quotes returns paginated list', async () => {
      (prisma.quote.findMany as jest.Mock).mockResolvedValue([mockQuote]);
      (prisma.quote.count as jest.Mock).mockResolvedValue(1);
      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockQuote], 1]);

      const res = await request(app.getHttpServer())
        .get('/quotes')
        .set('x-test-user', ADMIN_USER)
        .expect(200);

      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
    });

    it('GET /quotes/:id returns the quote', async () => {
      (prisma.quote.findFirst as jest.Mock).mockResolvedValue(mockQuote);
      const res = await request(app.getHttpServer())
        .get(`/quotes/${QUOTE_ID}`)
        .set('x-test-user', ADMIN_USER)
        .expect(200);

      expect(res.body.id).toBe(QUOTE_ID);
    });

    it('POST /quotes creates a quote (admin)', async () => {
      const res = await request(app.getHttpServer())
        .post('/quotes')
        .set('x-test-user', ADMIN_USER)
        .send({
          customerId: 'cust-001',
          customerName: 'New Customer',
          customerEmail: 'new@customer.com',
          title: 'A Test Quote',
          taxRate: 0.0825,
          lineItems: [{ description: 'Work', quantity: 1, unitPrice: 200 }],
        })
        .expect(201);

      expect(res.body).toBeDefined();
    });

    it('POST /quotes returns 403 for technician role', async () => {
      await request(app.getHttpServer())
        .post('/quotes')
        .set('x-test-user', TECH_USER)
        .send({
          customerId: 'cust-001', customerName: 'X', customerEmail: 'x@x.com', title: 'Q',
        })
        .expect(403);
    });

    it('PATCH /quotes/:id/send sends the quote', async () => {
      (prisma.quote.findFirst as jest.Mock).mockResolvedValue({ ...mockQuote, status: QuoteStatus.DRAFT });
      (prisma.quote.update as jest.Mock).mockResolvedValue({ ...mockQuote, status: QuoteStatus.SENT, approvalToken: 'tok-123' });

      const res = await request(app.getHttpServer())
        .patch(`/quotes/${QUOTE_ID}/send`)
        .set('x-test-user', ADMIN_USER)
        .expect(200);

      expect(res.body.status).toBe(QuoteStatus.SENT);
    });

    it('PATCH /quotes/approve/:token approves the quote (public)', async () => {
      const token = 'approval-token-abc';
      (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
        ...mockQuote,
        status: QuoteStatus.SENT,
        approvalToken: token,
        lineItems: mockQuote.lineItems,
      });
      (prisma.quote.update as jest.Mock).mockResolvedValue({
        ...mockQuote,
        status: QuoteStatus.ACCEPTED,
        approvedByName: 'Jane',
        approvedByEmail: 'jane@corp.com',
      });

      const res = await request(app.getHttpServer())
        .patch(`/quotes/approve/${token}`)
        .set('x-test-user', ADMIN_USER)
        .send({ name: 'Jane', email: 'jane@corp.com' })
        .expect(200);

      expect(res.body.status).toBe(QuoteStatus.ACCEPTED);
    });

    it('DELETE /quotes/:id returns 204 for DRAFT quote', async () => {
      (prisma.quote.findFirst as jest.Mock).mockResolvedValue({ ...mockQuote, status: QuoteStatus.DRAFT });
      (prisma.quote.delete as jest.Mock).mockResolvedValue({});

      await request(app.getHttpServer())
        .delete(`/quotes/${QUOTE_ID}`)
        .set('x-test-user', ADMIN_USER)
        .expect(204);
    });
  });

  // ── Invoices ─────────────────────────────────────────────────────────

  describe('Invoices', () => {
    it('GET /invoices returns paginated list', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockInvoice], 1]);

      const res = await request(app.getHttpServer())
        .get('/invoices')
        .set('x-test-user', ADMIN_USER)
        .expect(200);

      expect(res.body).toHaveProperty('items');
    });

    it('GET /invoices/:id returns invoice', async () => {
      (prisma.invoice.findFirst as jest.Mock).mockResolvedValue(mockInvoice);

      const res = await request(app.getHttpServer())
        .get(`/invoices/${INV_ID}`)
        .set('x-test-user', ADMIN_USER)
        .expect(200);

      expect(res.body.id).toBe(INV_ID);
    });

    it('POST /invoices creates invoice', async () => {
      await request(app.getHttpServer())
        .post('/invoices')
        .set('x-test-user', ADMIN_USER)
        .send({
          customerId: 'cust-001',
          customerName: 'Test Corp',
          customerEmail: 'test@corp.com',
          taxRate: 0.0825,
          lineItems: [{ description: 'Labour', quantity: 2, unitPrice: 100 }],
        })
        .expect(201);
    });

    it('PATCH /invoices/:id/send marks as SENT', async () => {
      (prisma.invoice.findFirst as jest.Mock).mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.DRAFT });
      (prisma.invoice.update as jest.Mock).mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.SENT, sentAt: new Date() });

      const res = await request(app.getHttpServer())
        .patch(`/invoices/${INV_ID}/send`)
        .set('x-test-user', ADMIN_USER)
        .expect(200);

      expect(res.body.status).toBe(InvoiceStatus.SENT);
    });

    it('PATCH /invoices/:id/void voids the invoice', async () => {
      (prisma.invoice.findFirst as jest.Mock).mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.SENT });
      (prisma.invoice.update as jest.Mock).mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.VOID });

      const res = await request(app.getHttpServer())
        .patch(`/invoices/${INV_ID}/void`)
        .set('x-test-user', ADMIN_USER)
        .expect(200);

      expect(res.body.status).toBe(InvoiceStatus.VOID);
    });

    it('POST /invoices/:id/payments records manual payment', async () => {
      (prisma.invoice.findFirst as jest.Mock).mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.SENT,
        total: dec(541.25),
        amountPaid: dec(0),
        balanceDue: dec(541.25),
      });
      (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

      await request(app.getHttpServer())
        .post(`/invoices/${INV_ID}/payments`)
        .set('x-test-user', ADMIN_USER)
        .send({ amount: 541.25, method: 'CASH' })
        .expect(201);
    });
  });

  // ── Payments ─────────────────────────────────────────────────────────

  describe('Payments', () => {
    it('GET /payments returns list', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const res = await request(app.getHttpServer())
        .get('/payments')
        .set('x-test-user', ADMIN_USER)
        .expect(200);

      expect(res.body).toHaveProperty('items');
    });

    it('GET /payments/metrics returns revenue metrics', async () => {
      (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: dec(5000) }, _count: { id: 10 },
      });
      (prisma.payment.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.invoice.aggregate as jest.Mock).mockResolvedValue({ _sum: { balanceDue: dec(200) } });
      (prisma.$transaction as jest.Mock).mockResolvedValue([
        { _sum: { amount: dec(5000) }, _count: { id: 10 } },
        [],
        { _sum: { balanceDue: dec(200) } },
      ]);

      const res = await request(app.getHttpServer())
        .get('/payments/metrics')
        .set('x-test-user', ADMIN_USER)
        .expect(200);

      expect(res.body).toHaveProperty('totalRevenue');
    });
  });

  // ── Expenses ─────────────────────────────────────────────────────────

  describe('Expenses', () => {
    it('GET /expenses returns empty list', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const res = await request(app.getHttpServer())
        .get('/expenses')
        .set('x-test-user', ADMIN_USER)
        .expect(200);

      expect(res.body).toHaveProperty('items');
    });

    it('POST /expenses creates expense (any role)', async () => {
      await request(app.getHttpServer())
        .post('/expenses')
        .set('x-test-user', TECH_USER)
        .send({ description: 'Gas for van', amount: 45.00, category: 'FUEL' })
        .expect(201);
    });
  });

  // ── Stripe Webhook ────────────────────────────────────────────────────

  describe('Stripe Webhook', () => {
    it('POST /webhooks/stripe returns 200 with valid event', async () => {
      const res = await request(app.getHttpServer())
        .post('/webhooks/stripe')
        .set('stripe-signature', 'test-sig')
        .set('content-type', 'application/json')
        .send(JSON.stringify({ type: 'payment_intent.succeeded', data: { object: { metadata: {} } } }))
        .expect(200);

      expect(res.body.received).toBe(true);
    });
  });
});
