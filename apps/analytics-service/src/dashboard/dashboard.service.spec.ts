/**
 * DashboardService — Unit Tests
 *
 * Tests:
 *  - getKpis() returns correctly shaped KPI cards
 *  - Revenue trend calculation (positive / zero prior)
 *  - Date range normalisation (default = last 30 days)
 *  - Outstanding invoices aggregation
 *  - Lead conversion rate calculation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

// ── Mock ───────────────────────────────────────────────────────────────────────

const COMPANY_ID = 'co-001';

const mockPrisma = {
  $queryRaw: jest.fn(),
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Sets up the mock to return results for each successive $queryRaw call
 * in the same order they are fired inside getKpis().
 */
function setupKpiMocks({
  revenue = '5000',
  priorRevenue = '4000',
  jobs = 10n,
  priorJobs = 8n,
  customers = 50n,
  avgRating = '4.5',
  outstandingCount = 3n,
  outstandingValue = '1500',
  leadsTotal = 20n,
  leadsConverted = 10n,
}: Partial<{
  revenue: string;
  priorRevenue: string;
  jobs: bigint;
  priorJobs: bigint;
  customers: bigint;
  avgRating: string;
  outstandingCount: bigint;
  outstandingValue: string;
  leadsTotal: bigint;
  leadsConverted: bigint;
}> = {}): void {
  mockPrisma.$queryRaw
    .mockResolvedValueOnce([{ total: revenue }])           // revenue current
    .mockResolvedValueOnce([{ total: priorRevenue }])      // revenue prior
    .mockResolvedValueOnce([{ cnt: jobs }])                // jobs current
    .mockResolvedValueOnce([{ cnt: priorJobs }])           // jobs prior
    .mockResolvedValueOnce([{ cnt: customers }])           // activeCustomers
    .mockResolvedValueOnce([{ avg: avgRating }])           // avgRating
    .mockResolvedValueOnce([{ cnt: outstandingCount, total: outstandingValue }]) // outstanding
    .mockResolvedValueOnce([{ total: leadsTotal, converted: leadsConverted }]);  // leads
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<DashboardService>(DashboardService);
  });

  describe('getKpis', () => {
    it('returns all KPI cards with correct structure', async () => {
      setupKpiMocks();

      const result = await service.getKpis(COMPANY_ID, {
        from: '2024-01-01',
        to: '2024-01-31',
      });

      expect(result.revenue.value).toBe(5000);
      expect(result.revenue.trend).toBe(25);  // (5000-4000)/4000 * 100
      expect(result.jobsCompleted.value).toBe(10);
      expect(result.jobsCompleted.trend).toBe(25);  // (10-8)/8 * 100
      expect(result.activeCustomers.value).toBe(50);
      expect(result.avgRating.value).toBe(4.5);
      expect(result.outstandingInvoices.value).toBe(3);
      expect(result.leadConversionRate.value).toBe(50);  // 10/20 * 100
      expect(result.periodLabel).toBeDefined();
    });

    it('handles zero prior period revenue (no division by zero)', async () => {
      setupKpiMocks({ priorRevenue: '0', revenue: '1000' });

      const result = await service.getKpis(COMPANY_ID, {});
      expect(result.revenue.trend).toBe(100);  // 100% growth from 0
    });

    it('formats currency correctly', async () => {
      setupKpiMocks({ revenue: '12345.67' });

      const result = await service.getKpis(COMPANY_ID, {});
      expect(result.revenue.formattedValue).toContain('12,346');  // rounded
    });

    it('uses defaults when no date range provided (last 30 days)', async () => {
      setupKpiMocks();
      // Should not throw and should call prisma queries
      await expect(service.getKpis(COMPANY_ID, {})).resolves.toBeDefined();
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(8);
    });

    it('shows N/A for avg rating when no reviews (0 value)', async () => {
      setupKpiMocks({ avgRating: '0' });

      const result = await service.getKpis(COMPANY_ID, {});
      expect(result.avgRating.formattedValue).toBe('N/A');
    });

    it('shows correct lead conversion rate for 0 leads', async () => {
      setupKpiMocks({ leadsTotal: 0n, leadsConverted: 0n });

      const result = await service.getKpis(COMPANY_ID, {});
      expect(result.leadConversionRate.value).toBe(0);
    });
  });
});
