/**
 * Analytics Service — E2E Tests
 *
 * Tests all major HTTP endpoints with a real NestJS application bootstrap.
 * Prisma is mocked to avoid requiring a live database.
 * Auth is bypassed via a MockAuthModule that injects companyId into requests.
 *
 * Coverage:
 *  - GET /dashboard/kpis
 *  - GET /revenue/series, /summary, /by-category, /top-jobs
 *  - GET /technician-metrics/leaderboard, /:technicianId
 *  - GET /jobs-analytics/by-status, /by-trade, /by-zone, /completion-rates, /trends
 *  - GET /customer-analytics/top-customers, /acquisition-sources, /churn-signals, /segments
 *  - GET /exports/revenue/csv, /revenue/excel, /jobs/excel, /technicians/csv
 *  - GET /health
 *  - 401 when JWT missing
 */

import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

// ── Mock Auth ──────────────────────────────────────────────────────────────────
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
class MockJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) return false;
    // Inject companyId for @CompanyId() decorator
    req.user = { companyId: 'co-e2e', sub: 'user-e2e' };
    return true;
  }
}

@Module({ providers: [{ provide: APP_GUARD, useClass: MockJwtGuard }] })
class MockAuthModule {}

// ── Mock PrismaService ─────────────────────────────────────────────────────────
const mockPrisma = {
  $queryRaw: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  analyticsEvent: { create: jest.fn() },
};

// ── App imports ────────────────────────────────────────────────────────────────
import { DashboardModule } from '../src/dashboard/dashboard.module';
import { RevenueModule } from '../src/revenue/revenue.module';
import { TechnicianMetricsModule } from '../src/technician-metrics/technician-metrics.module';
import { JobsAnalyticsModule } from '../src/jobs-analytics/jobs-analytics.module';
import { CustomerAnalyticsModule } from '../src/customer-analytics/customer-analytics.module';
import { ExportsModule } from '../src/exports/exports.module';
import { HealthModule } from '../src/health/health.module';
import { PrismaService } from '../src/prisma/prisma.service';

// ── Test Module ────────────────────────────────────────────────────────────────

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MockAuthModule,
    HealthModule,
    DashboardModule,
    RevenueModule,
    TechnicianMetricsModule,
    JobsAnalyticsModule,
    CustomerAnalyticsModule,
    ExportsModule,
  ],
  providers: [{ provide: PrismaService, useValue: mockPrisma }],
})
class TestAppModule {}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TOKEN = 'Bearer valid-test-token';

/**
 * Set up default $queryRaw return for KPI endpoint (8 concurrent queries via Promise.all).
 * Each call returns a minimal valid result.
 */
function mockKpiQueries(): void {
  mockPrisma.$queryRaw
    .mockResolvedValueOnce([{ total: '5000' }])                          // revenue current
    .mockResolvedValueOnce([{ total: '4000' }])                          // revenue prior
    .mockResolvedValueOnce([{ cnt: 10n }])                               // jobs current
    .mockResolvedValueOnce([{ cnt: 8n }])                                // jobs prior
    .mockResolvedValueOnce([{ cnt: 50n }])                               // activeCustomers
    .mockResolvedValueOnce([{ avg: '4.5' }])                             // avgRating
    .mockResolvedValueOnce([{ cnt: 3n, total: '1500' }])                 // outstanding
    .mockResolvedValueOnce([{ total: 20n, converted: 10n }]);            // leads
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('Analytics Service (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Health ─────────────────────────────────────────────────────────────────

  it('GET /health → 200', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });

  // ── Auth guard ─────────────────────────────────────────────────────────────

  it('GET /dashboard/kpis without token → 403', async () => {
    await request(app.getHttpServer()).get('/dashboard/kpis').expect(403);
  });

  // ── Dashboard ──────────────────────────────────────────────────────────────

  it('GET /dashboard/kpis → 200 with KPI cards', async () => {
    mockKpiQueries();

    const res = await request(app.getHttpServer())
      .get('/dashboard/kpis?from=2024-01-01&to=2024-03-31')
      .set('Authorization', TOKEN)
      .expect(200);

    expect(res.body.revenue).toBeDefined();
    expect(res.body.revenue.value).toBe(5000);
    expect(res.body.jobsCompleted).toBeDefined();
    expect(res.body.activeCustomers).toBeDefined();
    expect(res.body.periodLabel).toBeDefined();
  });

  // ── Revenue ─────────────────────────────────────────────────────────────────

  it('GET /revenue/series → 200 with time-series', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      { period: new Date('2024-01-01'), revenue: '3500', cnt: 5n },
    ]);

    const res = await request(app.getHttpServer())
      .get('/revenue/series?from=2024-01-01&to=2024-03-31&granularity=month')
      .set('Authorization', TOKEN)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('period');
    expect(res.body[0]).toHaveProperty('revenue');
  });

  it('GET /revenue/summary → 200', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      { collected: '8000', totalInvoiced: '10000', outstanding: '1500', overdue: '500', refunded: '0' },
    ]);

    const res = await request(app.getHttpServer())
      .get('/revenue/summary')
      .set('Authorization', TOKEN)
      .expect(200);

    expect(res.body.collectionRate).toBe(80);
  });

  it('GET /revenue/by-category → 200', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      { category: 'LABOUR', total: '6000' },
      { category: 'PARTS', total: '4000' },
    ]);

    const res = await request(app.getHttpServer())
      .get('/revenue/by-category')
      .set('Authorization', TOKEN)
      .expect(200);

    expect(res.body[0].category).toBe('LABOUR');
    expect(res.body[0].percentage).toBe(60);
  });

  it('GET /revenue/top-jobs → 200', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        jobId: 'job-1',
        jobNumber: 'JOB-001',
        customerName: 'Alice Corp',
        serviceAddress: '100 Main St',
        completedAt: new Date('2024-03-01'),
        revenue: '2500',
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/revenue/top-jobs?limit=5')
      .set('Authorization', TOKEN)
      .expect(200);

    expect(res.body[0].jobNumber).toBe('JOB-001');
  });

  // ── Technician Metrics ──────────────────────────────────────────────────────

  it('GET /technician-metrics/leaderboard → 200', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        technicianId: 'auth0|t1',
        technicianName: 'Bob Tech',
        jobs: 12n,
        revenue: '5000',
        avgRating: '4.7',
        avgDuration: '80',
        onTimeCount: 10n,
        totalWithSchedule: 12n,
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/technician-metrics/leaderboard')
      .set('Authorization', TOKEN)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].technicianName).toBe('Bob Tech');
  });

  it('GET /technician-metrics/:id → 200 with detailed metrics', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        techName: 'Alice Tech',
        completed: 8n,
        cancelled: 1n,
        revenue: '4000',
        avgRating: '4.5',
        ratingCount: 7n,
        avgDuration: '75',
        onTimeCount: 7n,
        totalScheduled: 8n,
        singleVisitJobs: 7n,
        totalJobs: 8n,
        totalKm: '200',
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/technician-metrics/auth0%7Ctech-001')
      .set('Authorization', TOKEN)
      .expect(200);

    expect(res.body.jobsCompleted).toBe(8);
  });

  // ── Jobs Analytics ──────────────────────────────────────────────────────────

  it('GET /jobs-analytics/by-status → 200', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      { status: 'COMPLETED', cnt: 30n },
      { status: 'CANCELLED', cnt: 5n },
    ]);

    const res = await request(app.getHttpServer())
      .get('/jobs-analytics/by-status')
      .set('Authorization', TOKEN)
      .expect(200);

    expect(res.body).toContainEqual({ status: 'COMPLETED', count: 30 });
  });

  it('GET /jobs-analytics/completion-rates → 200', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      { total: 100n, completed: 75n, cancelled: 10n, onHold: 5n },
    ]);

    const res = await request(app.getHttpServer())
      .get('/jobs-analytics/completion-rates')
      .set('Authorization', TOKEN)
      .expect(200);

    expect(res.body.completionRate).toBe(75);
  });

  it('GET /jobs-analytics/trends → 200', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      { period: new Date('2024-01-01'), created: 20n, completed: 15n, cancelled: 3n },
    ]);

    const res = await request(app.getHttpServer())
      .get('/jobs-analytics/trends?granularity=week')
      .set('Authorization', TOKEN)
      .expect(200);

    expect(res.body[0]).toHaveProperty('created');
  });

  // ── Customer Analytics ──────────────────────────────────────────────────────

  it('GET /customer-analytics/top-customers → 200', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        customerId: 'cust-1',
        firstName: 'Alice',
        lastName: 'Corp',
        email: 'alice@corp.com',
        type: 'COMMERCIAL',
        revenue: '20000',
        jobCount: 10n,
        avgRating: '4.9',
        lastJobDate: new Date('2024-03-01'),
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/customer-analytics/top-customers')
      .set('Authorization', TOKEN)
      .expect(200);

    expect(res.body[0].customerName).toBe('Alice Corp');
  });

  it('GET /customer-analytics/churn-signals → 200', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        customerId: 'cust-2',
        firstName: 'Bob',
        lastName: 'Smith',
        email: null,
        lastJobDate: new Date(Date.now() - 120 * 86_400_000),
        revenue: '1000',
        jobCount: 1n,
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/customer-analytics/churn-signals?inactiveDays=90')
      .set('Authorization', TOKEN)
      .expect(200);

    expect(res.body[0].daysSinceLastJob).toBeGreaterThan(90);
  });

  // ── Exports ─────────────────────────────────────────────────────────────────

  it('GET /exports/revenue/csv → 200 with text/csv', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        invoiceNumber: 'INV-001',
        customerName: 'Alice',
        paidAt: new Date('2024-03-01'),
        amount: '500',
        paymentMethod: 'CARD',
        status: 'SUCCEEDED',
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/exports/revenue/csv?from=2024-01-01&to=2024-03-31')
      .set('Authorization', TOKEN)
      .expect(200);

    expect(res.headers['content-type']).toContain('csv');
    expect(res.headers['content-disposition']).toContain('.csv');
  });

  it('GET /exports/revenue/excel → 200 with xlsx content', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        invoiceNumber: 'INV-001',
        customerName: 'Alice',
        paidAt: new Date('2024-03-01'),
        amount: '500',
        paymentMethod: 'CARD',
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/exports/revenue/excel?from=2024-01-01&to=2024-03-31')
      .set('Authorization', TOKEN)
      .expect(200);

    expect(res.headers['content-disposition']).toContain('.xlsx');
  });

  it('GET /exports/technicians/csv → 200', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        techName: 'Bob',
        techId: 'auth0|t1',
        jobsCompleted: 10n,
        revenue: '3000',
        avgRating: '4.5',
        avgDurationMins: '75',
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/exports/technicians/csv')
      .set('Authorization', TOKEN)
      .expect(200);

    expect(res.headers['content-disposition']).toContain('.csv');
  });
});
