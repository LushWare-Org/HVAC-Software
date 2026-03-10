/**
 * JobsAnalyticsService — Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JobsAnalyticsService } from './jobs-analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { GranularityEnum } from '../dashboard/dto/dashboard.dto';

const COMPANY_ID = 'co-001';
const mockPrisma = { $queryRaw: jest.fn() };

describe('JobsAnalyticsService', () => {
  let service: JobsAnalyticsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsAnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<JobsAnalyticsService>(JobsAnalyticsService);
  });

  describe('getByStatus', () => {
    it('returns job counts per status', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { status: 'COMPLETED', cnt: 30n },
        { status: 'CANCELLED', cnt: 5n },
        { status: 'PENDING', cnt: 10n },
      ]);

      const result = await service.getByStatus(COMPANY_ID, {});
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ status: 'COMPLETED', count: 30 });
    });
  });

  describe('getByTradeType', () => {
    it('calculates completion rate per trade', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          tradeType: 'HVAC',
          tradeSlug: 'hvac',
          jobCount: 20n,
          revenue: '8000',
          avgRating: '4.6',
          completed: 16n,
        },
      ]);

      const result = await service.getByTradeType(COMPANY_ID, {});
      expect(result[0].completionRate).toBe(80);  // 16/20 * 100
      expect(result[0].revenue).toBe(8000);
    });
  });

  describe('getCompletionRates', () => {
    it('calculates rates correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { total: 100n, completed: 75n, cancelled: 10n, onHold: 5n },
      ]);

      const result = await service.getCompletionRates(COMPANY_ID, {});
      expect(result.completionRate).toBe(75);
      expect(result.cancellationRate).toBe(10);
      expect(result.totalJobs).toBe(100);
    });

    it('returns 0 rates when no jobs', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { total: 0n, completed: 0n, cancelled: 0n, onHold: 0n },
      ]);

      const result = await service.getCompletionRates(COMPANY_ID, {});
      expect(result.completionRate).toBe(0);
    });
  });

  describe('getTrends', () => {
    it('returns job volume trend data', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          period: new Date('2024-01-01'),
          created: 15n,
          completed: 12n,
          cancelled: 2n,
        },
        {
          period: new Date('2024-01-08'),
          created: 18n,
          completed: 14n,
          cancelled: 1n,
        },
      ]);

      const result = await service.getTrends(COMPANY_ID, {}, GranularityEnum.WEEK);
      expect(result).toHaveLength(2);
      expect(result[0].created).toBe(15);
      expect(result[0].completed).toBe(12);
      expect(result[1].created).toBe(18);
    });
  });

  describe('getByZone', () => {
    it('returns job counts and revenue by city', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { city: 'Austin', state: 'TX', zip: '78701', jobCount: 25n, revenue: '12000' },
        { city: 'Dallas', state: 'TX', zip: '75201', jobCount: 18n, revenue: '9000' },
      ]);

      const result = await service.getByZone(COMPANY_ID, {});
      expect(result).toHaveLength(2);
      expect(result[0].city).toBe('Austin');
      expect(result[0].revenue).toBe(12000);
    });
  });
});
