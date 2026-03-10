/**
 * CustomerAnalyticsService — Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CustomerAnalyticsService } from './customer-analytics.service';
import { PrismaService } from '../prisma/prisma.service';

const COMPANY_ID = 'co-001';
const mockPrisma = { $queryRaw: jest.fn() };

describe('CustomerAnalyticsService', () => {
  let service: CustomerAnalyticsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerAnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<CustomerAnalyticsService>(CustomerAnalyticsService);
  });

  describe('getTopCustomers', () => {
    it('returns top customers with full name and revenue', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          customerId: 'cust-1',
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@test.com',
          type: 'COMMERCIAL',
          revenue: '15000',
          jobCount: 8n,
          avgRating: '4.8',
          lastJobDate: new Date('2024-03-01'),
        },
      ]);

      const result = await service.getTopCustomers(COMPANY_ID, {}, 5);
      expect(result[0].customerName).toBe('Alice Johnson');
      expect(result[0].totalRevenue).toBe(15000);
      expect(result[0].type).toBe('COMMERCIAL');
    });
  });

  describe('getAcquisitionSources', () => {
    it('calculates lead conversion rates per source', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { source: 'Google', total: 40n, converted: 20n, estimatedValue: '50000' },
        { source: 'Referral', total: 10n, converted: 7n, estimatedValue: '20000' },
        { source: 'Unknown', total: 5n, converted: 0n, estimatedValue: '0' },
      ]);

      const result = await service.getAcquisitionSources(COMPANY_ID, {});
      expect(result[0].conversionRate).toBe(50);   // 20/40
      expect(result[1].conversionRate).toBe(70);   // 7/10
      expect(result[2].conversionRate).toBe(0);    // 0/5
    });
  });

  describe('getChurnSignals', () => {
    it('returns at-risk customers with days since last job', async () => {
      const oldDate = new Date(Date.now() - 120 * 86_400_000);  // 120 days ago

      mockPrisma.$queryRaw.mockResolvedValue([
        {
          customerId: 'cust-2',
          firstName: 'Bob',
          lastName: 'Smith',
          email: 'bob@test.com',
          lastJobDate: oldDate,
          revenue: '3000',
          jobCount: 2n,
        },
      ]);

      const result = await service.getChurnSignals(COMPANY_ID, 90, 50);
      expect(result[0].customerName).toBe('Bob Smith');
      expect(result[0].daysSinceLastJob).toBeGreaterThan(100);
    });

    it('marks customers with no jobs as inactive', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          customerId: 'cust-3',
          firstName: 'Carol',
          lastName: 'Lee',
          email: null,
          lastJobDate: null,
          revenue: '0',
          jobCount: 0n,
        },
      ]);

      const result = await service.getChurnSignals(COMPANY_ID, 90, 50);
      expect(result[0].lastJobDate).toBe('Never');
      expect(result[0].daysSinceLastJob).toBeGreaterThan(90);
    });
  });

  describe('getSegmentSummary', () => {
    it('returns segment breakdown with avg job value', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { type: 'COMMERCIAL', count: 30n, revenue: '60000', jobCount: 120n },
        { type: 'RESIDENTIAL', count: 70n, revenue: '35000', jobCount: 200n },
      ]);

      const result = await service.getSegmentSummary(COMPANY_ID, {});
      expect(result[0].avgJobValue).toBe(500);   // 60000/120
      expect(result[1].avgJobValue).toBe(175);   // 35000/200
    });

    it('returns 0 avgJobValue when no jobs', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { type: 'RESIDENTIAL', count: 5n, revenue: '0', jobCount: 0n },
      ]);

      const result = await service.getSegmentSummary(COMPANY_ID, {});
      expect(result[0].avgJobValue).toBe(0);
    });
  });
});
