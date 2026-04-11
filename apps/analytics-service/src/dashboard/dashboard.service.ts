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

    const [revenue, priorRevenue, jobs, priorJobs, customers, rating, outstanding, leads] =
      await Promise.all([
        this.queryRevenue(companyId, from, to),
        this.queryRevenue(companyId, priorFrom, priorTo),
        this.queryJobsCompleted(companyId, from, to),
        this.queryJobsCompleted(companyId, priorFrom, priorTo),
        this.queryActiveCustomers(companyId),
        this.queryAvgRating(companyId, from, to),
        this.queryOutstandingInvoices(companyId),
        this.queryLeadConversion(companyId, from, to),
      ]);

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

  private async queryRevenue(companyId: string, from: Date, to: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ total: string }[]>(
      Prisma.sql`
        SELECT COALESCE(SUM(amount), 0)::TEXT AS total
        FROM   finance."Payment"
        WHERE  "companyId" = ${companyId}
          AND  status = 'SUCCEEDED'
          AND  "paidAt" BETWEEN ${from} AND ${to}
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
          AND  "completedAt" BETWEEN ${from} AND ${to}
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
