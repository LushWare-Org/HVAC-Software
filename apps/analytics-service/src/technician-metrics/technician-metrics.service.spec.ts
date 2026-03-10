/**
 * TechnicianMetricsService — Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TechnicianMetricsService } from './technician-metrics.service';
import { PrismaService } from '../prisma/prisma.service';

const COMPANY_ID = 'co-001';
const TECH_ID    = 'auth0|tech-001';

const mockPrisma = { $queryRaw: jest.fn() };

describe('TechnicianMetricsService', () => {
  let service: TechnicianMetricsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnicianMetricsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<TechnicianMetricsService>(TechnicianMetricsService);
  });

  describe('getLeaderboard', () => {
    it('computes composite performance score', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          technicianId: TECH_ID,
          technicianName: 'Bob Wrench',
          jobs: 15n,
          revenue: '6000',
          avgRating: '4.8',
          avgDuration: '90',
          onTimeCount: 12n,
          totalWithSchedule: 15n,
        },
      ]);

      const result = await service.getLeaderboard(COMPANY_ID, {}, 10);
      expect(result).toHaveLength(1);
      expect(result[0].technicianName).toBe('Bob Wrench');
      expect(result[0].jobsCompleted).toBe(15);
      expect(result[0].onTimeRate).toBe(80);  // 12/15 * 100
      expect(result[0].performanceScore).toBeGreaterThan(0);
    });

    it('returns 0 on-time rate when no scheduled jobs', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          technicianId: TECH_ID,
          technicianName: 'Alice Sparks',
          jobs: 5n,
          revenue: '2000',
          avgRating: '4.0',
          avgDuration: '60',
          onTimeCount: 0n,
          totalWithSchedule: 0n,
        },
      ]);

      const result = await service.getLeaderboard(COMPANY_ID, {}, 10);
      expect(result[0].onTimeRate).toBe(0);
    });
  });

  describe('getMetrics', () => {
    it('returns detailed metrics for a technician', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          techName: 'Carol Pipes',
          completed: 12n,
          cancelled: 1n,
          revenue: '9000',
          avgRating: '4.7',
          ratingCount: 10n,
          avgDuration: '85',
          onTimeCount: 10n,
          totalScheduled: 12n,
          singleVisitJobs: 10n,
          totalJobs: 12n,
          totalKm: '450',
        },
      ]);

      const result = await service.getMetrics(COMPANY_ID, TECH_ID, {});
      expect(result.jobsCompleted).toBe(12);
      expect(result.revenue).toBe(9000);
      expect(result.firstTimeFixRate).toBe(83);   // 10/12 * 100 = 83%
      expect(result.onTimeRate).toBe(83);          // 10/12 * 100 = 83%
      expect(result.totalTravelKm).toBe(450);
    });

    it('returns empty metrics when technician has no records', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getMetrics(COMPANY_ID, 'unknown-tech', {});
      expect(result.jobsCompleted).toBe(0);
      expect(result.revenue).toBe(0);
      expect(result.technicianName).toBe('Unknown');
    });
  });
});
