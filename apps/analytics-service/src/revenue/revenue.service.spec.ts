/**
 * RevenueService — Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RevenueService } from './revenue.service';
import { PrismaService } from '../prisma/prisma.service';
import { GranularityEnum } from '../dashboard/dto/dashboard.dto';

const COMPANY_ID = 'co-001';

const mockPrisma = { $queryRaw: jest.fn() };

describe('RevenueService', () => {
  let service: RevenueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<RevenueService>(RevenueService);
  });

  // ── getSeries ───────────────────────────────────────────────────────────────

  describe('getSeries', () => {
    it('returns parsed revenue time-series data', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { period: new Date('2024-01-01'), revenue: '3500.00', cnt: 5n },
        { period: new Date('2024-02-01'), revenue: '4200.50', cnt: 7n },
      ]);

      const result = await service.getSeries(
        COMPANY_ID,
        { from: '2024-01-01', to: '2024-03-01' },
        GranularityEnum.MONTH,
      );

      expect(result).toHaveLength(2);
      expect(result[0].revenue).toBe(3500);
      expect(result[0].invoiceCount).toBe(5);
      expect(result[1].revenue).toBe(4200.5);
    });

    it('returns empty array when no revenue in period', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);
      const result = await service.getSeries(COMPANY_ID, {});
      expect(result).toEqual([]);
    });
  });

  // ── getByCategory ───────────────────────────────────────────────────────────

  describe('getByCategory', () => {
    it('calculates percentage for each category', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { category: 'LABOUR', total: '6000' },
        { category: 'PARTS', total: '4000' },
      ]);

      const result = await service.getByCategory(COMPANY_ID, {});
      expect(result[0].category).toBe('LABOUR');
      expect(result[0].percentage).toBe(60);  // 6000/10000
      expect(result[1].percentage).toBe(40);
    });

    it('handles zero total (avoids division by zero)', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { category: 'LABOUR', total: '0' },
      ]);
      const result = await service.getByCategory(COMPANY_ID, {});
      expect(result[0].percentage).toBe(0);
    });
  });

  // ── getTopJobs ──────────────────────────────────────────────────────────────

  describe('getTopJobs', () => {
    it('returns top jobs with parsed revenue', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          jobId: 'job-1',
          jobNumber: 'JOB-001',
          customerName: 'Alice Corp',
          serviceAddress: '100 Main St',
          completedAt: new Date('2024-03-15'),
          revenue: '2500',
        },
      ]);

      const result = await service.getTopJobs(COMPANY_ID, {}, 10);
      expect(result).toHaveLength(1);
      expect(result[0].revenue).toBe(2500);
      expect(result[0].jobNumber).toBe('JOB-001');
    });
  });

  // ── getSummary ──────────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('calculates collection rate correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          collected: '8000',
          totalInvoiced: '10000',
          outstanding: '1500',
          overdue: '500',
          refunded: '0',
        },
      ]);

      const result = await service.getSummary(COMPANY_ID, {});
      expect(result.collectionRate).toBe(80);   // 8000/10000 * 100
      expect(result.outstanding).toBe(1500);
      expect(result.overdue).toBe(500);
    });

    it('returns 0 collection rate when nothing invoiced', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { collected: '0', totalInvoiced: '0', outstanding: '0', overdue: '0', refunded: '0' },
      ]);
      const result = await service.getSummary(COMPANY_ID, {});
      expect(result.collectionRate).toBe(0);
    });
  });
});
