/**
 * PaymentsService — Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '../prisma/generated';

function makeDecimal(n: number) {
  return { toString: () => String(n) } as any;
}

const COMPANY_ID = 'company-001';
const PAYMENT_ID = 'pay-001';

function makePayment(overrides: Partial<any> = {}): any {
  return {
    id: PAYMENT_ID,
    companyId: COMPANY_ID,
    invoiceId: 'inv-001',
    amount: makeDecimal(250),
    paymentMethod: 'CARD',
    status: PaymentStatus.SUCCEEDED,
    paidAt: new Date(),
    createdAt: new Date(),
    invoice: { invoiceNumber: 'INV-2024-0001', customerName: 'Test Corp', customerEmail: 'test@corp.com' },
    ...overrides,
  };
}

const mockPrisma = {
  payment: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  invoice: {
    aggregate: jest.fn(),
  },
  $transaction: jest.fn((args: any[]) => Promise.all(args)),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('findOne', () => {
    it('returns payment when found', async () => {
      const p = makePayment();
      mockPrisma.payment.findFirst.mockResolvedValue(p);
      const result = await service.findOne(COMPANY_ID, PAYMENT_ID);
      expect(result).toEqual(p);
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      await expect(service.findOne(COMPANY_ID, 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('paginates correctly', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([makePayment()]);
      mockPrisma.payment.count.mockResolvedValue(15);

      const result = await service.findAll(COMPANY_ID, { page: 2, limit: 5 });

      const findCall = mockPrisma.payment.findMany.mock.calls[0][0];
      expect(findCall.skip).toBe(5);  // (2-1)*5
      expect(findCall.take).toBe(5);
      expect(result.total).toBe(15);
      expect(result.page).toBe(2);
    });
  });

  describe('getMetrics', () => {
    it('returns revenue, count, outstanding and breakdown', async () => {
      mockPrisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: makeDecimal(5000) },
        _count: { id: 12 },
      });
      mockPrisma.payment.groupBy.mockResolvedValue([
        { paymentMethod: 'CARD', _sum: { amount: makeDecimal(4000) }, _count: { id: 10 } },
        { paymentMethod: 'CASH', _sum: { amount: makeDecimal(1000) }, _count: { id: 2 } },
      ]);
      mockPrisma.invoice.aggregate.mockResolvedValue({
        _sum: { balanceDue: makeDecimal(750) },
      });

      const metrics = await service.getMetrics(COMPANY_ID);

      expect(metrics.totalRevenue).toBe(5000);
      expect(metrics.totalPayments).toBe(12);
      expect(metrics.outstandingBalance).toBe(750);
      expect(metrics.byMethod).toHaveLength(2);
      expect(metrics.byMethod[0].method).toBe('CARD');
      expect(metrics.byMethod[0].total).toBe(4000);
    });
  });
});
