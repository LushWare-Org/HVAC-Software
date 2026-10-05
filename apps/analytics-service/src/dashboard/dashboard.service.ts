/**
 * DashboardService
 *
 * Provides KPI summary cards for the admin dashboard:
 *  - Total revenue (current period vs prior period → trend %)
 *  - Total jobs (current vs prior)
 *  - Active customers
 *  - Average job rating
 *  - Outstanding invoices count + value
 *  - Conversion rate (leads → customers)
 *
 * All queries use $queryRaw with fully-qualified schema.table names so
 * the analytics service never needs write access to other schemas.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../redis-cache.service';
import { DateRangeDto } from './dto/dashboard.dto';
import { Prisma } from '../prisma/generated';

export interface KpiCard {
  label: string;
  value: number;
  formattedValue: string;
  trend?: number;          // % change vs prior period (positive = growth)
  trendLabel?: string;
  unit?: string;
}

export interface DashboardKpis {
  revenue: KpiCard;
  jobsCompleted: KpiCard;
  activeCustomers: KpiCard;
  avgRating: KpiCard;
  outstandingInvoices: KpiCard;
  leadConversionRate: KpiCard;
  periodLabel: string;
}

/** Cash position for the dashboard's money band. */
export interface DashboardMoney {
  collectedToday: number;
  collectedThisWeek: number;
  outstanding: number;
  overdueCount: number;
  overdueAmount: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async getKpis(companyId: string, dto: DateRangeDto): Promise<DashboardKpis> {
    const { from, to } = this.normaliseDateRange(dto);
    const cacheKey = `analytics:kpis:${companyId}:${from.toISOString()}:${to.toISOString()}`;
    const cached = await this.cache.get<DashboardKpis>(cacheKey);
    if (cached) return cached;
    const periodMs = to.getTime() - from.getTime();
    const priorFrom = new Date(from.getTime() - periodMs);
    const priorTo = new Date(from.getTime() - 1);

    const revenue = await this.queryRevenue(companyId, from, to);
    const priorRevenue = await this.queryRevenue(companyId, priorFrom, priorTo);
    const jobs = await this.queryJobsCompleted(companyId, from, to);
    const priorJobs = await this.queryJobsCompleted(companyId, priorFrom, priorTo);
    const customers = await this.queryActiveCustomers(companyId);
    const rating = await this.queryAvgRating(companyId, from, to);
    const outstanding = await this.queryOutstandingInvoices(companyId);
    const leads = await this.queryLeadConversion(companyId, from, to);

    const trend = (curr: number, prior: number): number => {
      if (prior === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prior) / prior) * 100);
    };

    const result: DashboardKpis = {
      revenue: {
        label: 'Revenue',
        value: revenue,
        formattedValue: this.formatCurrency(revenue),
        trend: trend(revenue, priorRevenue),
        trendLabel: 'vs prior period',
        unit: 'USD',
      },
      jobsCompleted: {
        label: 'Jobs Completed',
        value: jobs,
        formattedValue: jobs.toString(),
        trend: trend(jobs, priorJobs),
        trendLabel: 'vs prior period',
      },
      activeCustomers: {
        label: 'Active Customers',
        value: customers,
        formattedValue: customers.toString(),
      },
      avgRating: {
        label: 'Average Rating',
        value: rating,
        formattedValue: rating > 0 ? rating.toFixed(1) : 'N/A',
        unit: '/5',
      },
      outstandingInvoices: {
        label: 'Outstanding Invoices',
        value: outstanding.count,
        formattedValue: this.formatCurrency(outstanding.value),
        unit: `(${outstanding.count} invoices)`,
      },
      leadConversionRate: {
        label: 'Lead Conversion Rate',
        value: leads.rate,
        formattedValue: `${leads.rate}%`,
        unit: `${leads.converted}/${leads.total} leads`,
      },
      periodLabel: `${from.toLocaleDateString()} – ${to.toLocaleDateString()}`,
    };
    await this.cache.set(cacheKey, result, 120); // 2-minute cache
    return result;
  }

  // ── Private query helpers ───────────────────────────────────────────────────

  /**
   * Money actually received (succeeded payments) since the caller's local
   * start of day and week, plus what customers still owe. "Today" is the
   * user's day, not the server's, so the browser sends both boundaries.
   * Overdue counts invoices past their due date even if a scheduled job has
   * not flipped them to OVERDUE yet.
   */
  async getMoney(companyId: string, todayStart: Date, weekStart: Date): Promise<DashboardMoney> {
    const since = todayStart < weekStart ? todayStart : weekStart;
    const [paid] = await this.prisma.$queryRaw<{ today: string; week: string }[]>(
      Prisma.sql`
        SELECT COALESCE(SUM(amount) FILTER (WHERE "paidAt" >= ${todayStart}), 0)::TEXT AS today,
               COALESCE(SUM(amount) FILTER (WHERE "paidAt" >= ${weekStart}), 0)::TEXT  AS week
        FROM   finance."Payment"
        WHERE  "companyId" = ${companyId}
          AND  status = 'SUCCEEDED'
          AND  "paidAt" >= ${since}
      `,
    );
    const [owed] = await this.prisma.$queryRaw<{ outstanding: string; overdue_count: bigint; overdue_amount: string }[]>(
      Prisma.sql`
        SELECT COALESCE(SUM("balanceDue"), 0)::TEXT AS outstanding,
               COUNT(*) FILTER (WHERE status = 'OVERDUE' OR "dueDate" < NOW())                         AS overdue_count,
               COALESCE(SUM("balanceDue") FILTER (WHERE status = 'OVERDUE' OR "dueDate" < NOW()), 0)::TEXT AS overdue_amount
        FROM   finance."Invoice"
        WHERE  "companyId" = ${companyId}
          AND  status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE')
          AND  "balanceDue" > 0
      `,
    );
    return {
      collectedToday: parseFloat(paid?.today ?? '0'),
      collectedThisWeek: parseFloat(paid?.week ?? '0'),
      outstanding: parseFloat(owed?.outstanding ?? '0'),
      overdueCount: Number(owed?.overdue_count ?? 0),
      overdueAmount: parseFloat(owed?.overdue_amount ?? '0'),
    };
  }

  private async queryRevenue(companyId: string, from: Date, to: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ total: string }[]>(
      Prisma.sql`
        SELECT (
          -- Stripe payments
          COALESCE((
            SELECT SUM(amount)
            FROM   finance."Payment"
            WHERE  "companyId" = ${companyId}
              AND  status = 'SUCCEEDED'
              AND  "paidAt" BETWEEN ${from} AND ${to}
          ), 0)
          +
          -- Invoice totals where no succeeded payment exists (cash/check or Stripe not set up)
          COALESCE((
            SELECT SUM(i.total)
            FROM   finance."Invoice" i
            WHERE  i."companyId" = ${companyId}
              AND  i.status NOT IN ('DRAFT','VOID')
              AND  COALESCE(i."sentAt", i."createdAt") BETWEEN ${from} AND ${to}
              AND  NOT EXISTS (
                    SELECT 1 FROM finance."Payment" p
                    WHERE  p."invoiceId" = i.id AND p.status = 'SUCCEEDED'
                   )
          ), 0)
        )::TEXT AS total
      `,
    );
    return parseFloat(rows[0]?.total ?? '0');
  }

  private async queryJobsCompleted(companyId: string, from: Date, to: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ cnt: bigint }[]>(
      Prisma.sql`
        SELECT COUNT(*)::BIGINT AS cnt
        FROM   jobs.jobs
        WHERE  "companyId" = ${companyId}
          AND  status IN ('COMPLETED', 'INVOICED', 'PAID')
          AND  COALESCE("completedAt", "updatedAt") BETWEEN ${from} AND ${to}
      `,
    );
    return Number(rows[0]?.cnt ?? 0);
  }

  private async queryActiveCustomers(companyId: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ cnt: bigint }[]>(
      Prisma.sql`
        SELECT COUNT(*)::BIGINT AS cnt
        FROM   crm.customers
        WHERE  "companyId" = ${companyId}
          AND  "isActive" = TRUE
          AND NOT (
            source = 'portal'
            AND "engagementStatus" = 'INACTIVE'
            AND tags @> ARRAY['portal-signup']::text[]
          )
      `,
    );
    return Number(rows[0]?.cnt ?? 0);
  }

  private async queryAvgRating(companyId: string, from: Date, to: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ avg: string | null }[]>(
      Prisma.sql`
        SELECT ROUND(AVG(rating)::NUMERIC, 1)::TEXT AS avg
        FROM   crm.reviews
        WHERE  "companyId" = ${companyId}
          AND  "createdAt" BETWEEN ${from} AND ${to}
      `,
    );
    return parseFloat(rows[0]?.avg ?? '0');
  }

  private async queryOutstandingInvoices(
    companyId: string,
  ): Promise<{ count: number; value: number }> {
    const rows = await this.prisma.$queryRaw<{ cnt: bigint; total: string }[]>(
      Prisma.sql`
        SELECT COUNT(*)::BIGINT AS cnt,
               COALESCE(SUM("balanceDue"), 0)::TEXT AS total
        FROM   finance."Invoice"
        WHERE  "companyId" = ${companyId}
          AND  status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE')
      `,
    );
    return {
      count: Number(rows[0]?.cnt ?? 0),
      value: parseFloat(rows[0]?.total ?? '0'),
    };
  }

  private async queryLeadConversion(
    companyId: string,
    from: Date,
    to: Date,
  ): Promise<{ rate: number; converted: number; total: number }> {
    const rows = await this.prisma.$queryRaw<{ total: bigint; converted: bigint }[]>(
      Prisma.sql`
        SELECT COUNT(*)::BIGINT AS total,
               COUNT(*) FILTER (WHERE status = 'WON')::BIGINT AS converted
        FROM   crm.leads
        WHERE  "companyId" = ${companyId}
          AND  "createdAt" BETWEEN ${from} AND ${to}
      `,
    );
    const total = Number(rows[0]?.total ?? 0);
    const converted = Number(rows[0]?.converted ?? 0);
    const rate = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { rate, converted, total };
  }

  private normaliseDateRange(dto: DateRangeDto): { from: Date; to: Date } {
    const now = new Date();
    const to = dto.to ? new Date(dto.to) : now;
    let from: Date;
    if (dto.from) {
      from = new Date(dto.from);
    } else {
      // default: last 30 days
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    return { from, to };
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  }
}
