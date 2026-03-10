/**
 * CustomerAnalyticsService
 *
 * Customer lifetime value, retention and acquisition analytics:
 *  - getTopCustomers()     — top N by total revenue (LTV)
 *  - getAcquisitionSources() — lead/customer counts per source channel
 *  - getRetentionCohort()  — monthly cohort retention table
 *  - getChurnSignals()     — customers with no job in last N days (at-risk)
 *  - getSegmentSummary()   — residential vs commercial breakdown
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeDto } from '../dashboard/dto/dashboard.dto';
import { Prisma } from '../prisma/generated';

export interface TopCustomer {
  customerId: string;
  customerName: string;
  email: string;
  totalRevenue: number;
  jobCount: number;
  avgRating: number;
  lastJobDate: string;
  type: string;
}

export interface AcquisitionSource {
  source: string;
  leadCount: number;
  convertedCount: number;
  conversionRate: number;
  estimatedValue: number;
}

export interface ChurnSignal {
  customerId: string;
  customerName: string;
  email: string;
  lastJobDate: string;
  daysSinceLastJob: number;
  totalRevenue: number;
  jobCount: number;
}

export interface CustomerSegmentSummary {
  type: string;
  count: number;
  revenue: number;
  avgJobValue: number;
}

@Injectable()
export class CustomerAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopCustomers(
    companyId: string,
    dto: DateRangeDto,
    limit = 20,
  ): Promise<TopCustomer[]> {
    const { from, to } = this.normaliseDateRange(dto);

    const rows = await this.prisma.$queryRaw<
      {
        customerId: string;
        firstName: string;
        lastName: string;
        email: string | null;
        type: string;
        revenue: string;
        jobCount: bigint;
        avgRating: string | null;
        lastJobDate: Date | null;
      }[]
    >(
      Prisma.sql`
        SELECT
          c.id                                    AS "customerId",
          c."firstName",
          c."lastName",
          c.email,
          c.type::TEXT,
          COALESCE(SUM(p.amount), 0)::TEXT        AS revenue,
          COUNT(DISTINCT j.id)::BIGINT            AS "jobCount",
          ROUND(AVG(r.rating)::NUMERIC, 1)::TEXT  AS "avgRating",
          MAX(j."completedAt")                    AS "lastJobDate"
        FROM   crm.customers c
        LEFT   JOIN jobs.jobs j         ON j."customerId" = c.id
          AND  j."completedAt" BETWEEN ${from} AND ${to}
        LEFT   JOIN finance.invoices i  ON i."customerId" = c.id
          AND  i.status IN ('PAID')
          AND  i."paidAt" BETWEEN ${from} AND ${to}
        LEFT   JOIN finance.payments p  ON p."invoiceId" = i.id AND p.status = 'SUCCEEDED'
        LEFT   JOIN crm.reviews r       ON r."customerId" = c.id
          AND  r."createdAt" BETWEEN ${from} AND ${to}
        WHERE  c."companyId" = ${companyId}
          AND  c."isActive" = TRUE
        GROUP  BY c.id, c."firstName", c."lastName", c.email, c.type
        ORDER  BY COALESCE(SUM(p.amount), 0) DESC
        LIMIT  ${limit}
      `,
    );

    return rows.map((r) => ({
      customerId: r.customerId,
      customerName: `${r.firstName} ${r.lastName}`.trim(),
      email: r.email ?? '',
      totalRevenue: parseFloat(r.revenue),
      jobCount: Number(r.jobCount),
      avgRating: parseFloat(r.avgRating ?? '0'),
      lastJobDate: r.lastJobDate?.toISOString() ?? '',
      type: r.type,
    }));
  }

  async getAcquisitionSources(
    companyId: string,
    dto: DateRangeDto,
  ): Promise<AcquisitionSource[]> {
    const { from, to } = this.normaliseDateRange(dto);

    const rows = await this.prisma.$queryRaw<
      {
        source: string;
        total: bigint;
        converted: bigint;
        estimatedValue: string;
      }[]
    >(
      Prisma.sql`
        SELECT
          COALESCE(source, 'Unknown')             AS source,
          COUNT(*)::BIGINT                         AS total,
          COUNT(*) FILTER (WHERE status = 'WON')::BIGINT AS converted,
          COALESCE(SUM("estimatedValue"), 0)::TEXT AS "estimatedValue"
        FROM   crm.leads
        WHERE  "companyId" = ${companyId}
          AND  "createdAt" BETWEEN ${from} AND ${to}
        GROUP  BY source
        ORDER  BY COUNT(*) DESC
      `,
    );

    return rows.map((r) => {
      const total = Number(r.total);
      const converted = Number(r.converted);
      return {
        source: r.source,
        leadCount: total,
        convertedCount: converted,
        conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
        estimatedValue: parseFloat(r.estimatedValue),
      };
    });
  }

  async getChurnSignals(
    companyId: string,
    inactiveDays = 90,
    limit = 50,
  ): Promise<ChurnSignal[]> {
    const cutoff = new Date(Date.now() - inactiveDays * 86_400_000);

    const rows = await this.prisma.$queryRaw<
      {
        customerId: string;
        firstName: string;
        lastName: string;
        email: string | null;
        lastJobDate: Date | null;
        revenue: string;
        jobCount: bigint;
      }[]
    >(
      Prisma.sql`
        SELECT
          c.id                                 AS "customerId",
          c."firstName",
          c."lastName",
          c.email,
          MAX(j."completedAt")                 AS "lastJobDate",
          COALESCE(SUM(p.amount), 0)::TEXT     AS revenue,
          COUNT(DISTINCT j.id)::BIGINT         AS "jobCount"
        FROM   crm.customers c
        LEFT   JOIN jobs.jobs j        ON j."customerId" = c.id
          AND  j.status IN ('COMPLETED','INVOICED','PAID')
        LEFT   JOIN finance.invoices i ON i."customerId" = c.id
          AND  i.status = 'PAID'
        LEFT   JOIN finance.payments p ON p."invoiceId" = i.id AND p.status = 'SUCCEEDED'
        WHERE  c."companyId" = ${companyId}
          AND  c."isActive" = TRUE
        GROUP  BY c.id, c."firstName", c."lastName", c.email
        HAVING MAX(j."completedAt") < ${cutoff}
            OR MAX(j."completedAt") IS NULL
        ORDER  BY MAX(j."completedAt") ASC NULLS FIRST
        LIMIT  ${limit}
      `,
    );

    const now = Date.now();
    return rows.map((r) => {
      const lastJobDate = r.lastJobDate;
      const daysSinceLastJob = lastJobDate
        ? Math.floor((now - lastJobDate.getTime()) / 86_400_000)
        : inactiveDays + 1;

      return {
        customerId: r.customerId,
        customerName: `${r.firstName} ${r.lastName}`.trim(),
        email: r.email ?? '',
        lastJobDate: lastJobDate?.toISOString() ?? 'Never',
        daysSinceLastJob,
        totalRevenue: parseFloat(r.revenue),
        jobCount: Number(r.jobCount),
      };
    });
  }

  async getSegmentSummary(
    companyId: string,
    dto: DateRangeDto,
  ): Promise<CustomerSegmentSummary[]> {
    const { from, to } = this.normaliseDateRange(dto);

    const rows = await this.prisma.$queryRaw<
      { type: string; count: bigint; revenue: string; jobCount: bigint }[]
    >(
      Prisma.sql`
        SELECT
          c.type::TEXT,
          COUNT(DISTINCT c.id)::BIGINT        AS count,
          COALESCE(SUM(p.amount), 0)::TEXT    AS revenue,
          COUNT(DISTINCT j.id)::BIGINT        AS "jobCount"
        FROM   crm.customers c
        LEFT   JOIN jobs.jobs j        ON j."customerId" = c.id
          AND  j."completedAt" BETWEEN ${from} AND ${to}
        LEFT   JOIN finance.invoices i ON i."customerId" = c.id AND i.status = 'PAID'
          AND  i."paidAt" BETWEEN ${from} AND ${to}
        LEFT   JOIN finance.payments p ON p."invoiceId" = i.id AND p.status = 'SUCCEEDED'
        WHERE  c."companyId" = ${companyId}
          AND  c."isActive" = TRUE
        GROUP  BY c.type
        ORDER  BY COALESCE(SUM(p.amount), 0) DESC
      `,
    );

    return rows.map((r) => {
      const revenue = parseFloat(r.revenue);
      const jobCount = Number(r.jobCount);
      return {
        type: r.type,
        count: Number(r.count),
        revenue,
        avgJobValue: jobCount > 0 ? Math.round(revenue / jobCount) : 0,
      };
    });
  }

  private normaliseDateRange(dto: DateRangeDto): { from: Date; to: Date } {
    const now = new Date();
    return {
      from: dto.from ? new Date(dto.from) : new Date(now.getTime() - 90 * 86_400_000),
      to: dto.to ? new Date(dto.to) : now,
    };
  }
}
