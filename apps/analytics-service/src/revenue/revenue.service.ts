/**
 * RevenueService
 *
 * Time-series revenue analytics:
 *  - getSeries()   — revenue bucketed by day / week / month / quarter / year
 *  - getByType()   — revenue split by invoice line-item category (Labour, Parts, etc.)
 *  - getTopJobs()  — top N highest-value completed jobs
 *  - getSummary()  — total collected, outstanding, refunded
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeDto, GranularityEnum } from '../dashboard/dto/dashboard.dto';
import { Prisma } from '../prisma/generated';

export interface RevenuePoint {
  period: string;    // e.g. '2024-03' for month granularity
  revenue: number;
  invoiceCount: number;
}

export interface RevenueByCategory {
  category: string;
  total: number;
  percentage: number;
}

export interface TopJob {
  jobId: string;
  jobNumber: string;
  customerName: string;
  serviceAddress: string;
  completedAt: string;
  revenue: number;
}

export interface RevenueSummary {
  collected: number;
  outstanding: number;
  overdue: number;
  refunded: number;
  totalInvoiced: number;
  collectionRate: number;  // collected / totalInvoiced %
}

@Injectable()
export class RevenueService {
  constructor(private readonly prisma: PrismaService) {}

  async getSeries(
    companyId: string,
    dto: DateRangeDto,
    granularity: GranularityEnum = GranularityEnum.MONTH,
  ): Promise<RevenuePoint[]> {
    const { from, to } = this.normaliseDateRange(dto);

    // date_trunc maps granularity to Postgres truncation level
    const trunc = this.granularityToTrunc(granularity);

    // Primary: use Payments (Stripe processed). Fallback: use Invoice.total for
    // businesses that haven't set up Stripe yet — so charts always show data.
    const rows = await this.prisma.$queryRaw<
      { period: Date; revenue: string; cnt: bigint }[]
    >(
      Prisma.sql`
        SELECT sub.period, SUM(sub.revenue)::TEXT AS revenue, SUM(sub.cnt)::BIGINT AS cnt
        FROM (
          -- Stripe payments
          SELECT DATE_TRUNC(${trunc}, "paidAt") AS period,
                 SUM(amount)                    AS revenue,
                 COUNT(*)                       AS cnt
          FROM   finance."Payment"
          WHERE  "companyId" = ${companyId}
            AND  status = 'SUCCEEDED'
            AND  "paidAt" BETWEEN ${from} AND ${to}
          GROUP  BY 1

          UNION ALL

          -- Invoice totals for invoices NOT backed by a succeeded payment
          SELECT DATE_TRUNC(${trunc}, COALESCE(i."sentAt", i."createdAt")) AS period,
                 SUM(i.total)                                               AS revenue,
                 COUNT(*)                                                   AS cnt
          FROM   finance."Invoice" i
          WHERE  i."companyId" = ${companyId}
            AND  i.status NOT IN ('DRAFT','VOID')
            AND  COALESCE(i."sentAt", i."createdAt") BETWEEN ${from} AND ${to}
            AND  NOT EXISTS (
                  SELECT 1 FROM finance."Payment" p
                  WHERE  p."invoiceId" = i.id AND p.status = 'SUCCEEDED'
                 )
          GROUP  BY 1
        ) sub
        WHERE sub.period IS NOT NULL
        GROUP  BY sub.period
        ORDER  BY sub.period
      `,
    );

    return rows.map((r) => ({
      period: r.period.toISOString().slice(0, 10),
      revenue: parseFloat(r.revenue),
      invoiceCount: Number(r.cnt),
    }));
  }

  async getByCategory(companyId: string, dto: DateRangeDto): Promise<RevenueByCategory[]> {
    const { from, to } = this.normaliseDateRange(dto);

    const rows = await this.prisma.$queryRaw<
      { category: string; total: string }[]
    >(
      Prisma.sql`
        SELECT il.category::TEXT,
               SUM(il."lineTotal")::TEXT AS total
        FROM   finance."InvoiceLineItem" il
        JOIN   finance."Invoice" i ON i.id = il."invoiceId"
        WHERE  i."companyId" = ${companyId}
          AND  i.status NOT IN ('DRAFT','VOID')
          AND  COALESCE(i."sentAt", i."createdAt") BETWEEN ${from} AND ${to}
        GROUP  BY il.category
        ORDER  BY SUM(il."lineTotal") DESC
      `,
    );

    const grandTotal = rows.reduce((sum, r) => sum + parseFloat(r.total), 0);

    return rows.map((r) => ({
      category: r.category,
      total: parseFloat(r.total),
      percentage:
        grandTotal > 0 ? Math.round((parseFloat(r.total) / grandTotal) * 100) : 0,
    }));
  }

  async getTopJobs(
    companyId: string,
    dto: DateRangeDto,
    limit = 10,
  ): Promise<TopJob[]> {
    const { from, to } = this.normaliseDateRange(dto);

    const rows = await this.prisma.$queryRaw<
      {
        jobId: string;
        jobNumber: string;
        customerName: string;
        serviceAddress: string;
        completedAt: Date;
        revenue: string;
      }[]
    >(
      Prisma.sql`
        SELECT j.id            AS "jobId",
               j."jobNumber",
               j."customerName",
               j."serviceAddress",
               j."completedAt",
               SUM(p.amount)::TEXT AS revenue
        FROM   jobs.jobs j
        JOIN   finance."Invoice" i ON i."jobId" = j.id
        JOIN   finance."Payment" p ON p."invoiceId" = i.id AND p.status = 'SUCCEEDED'
        WHERE  j."companyId" = ${companyId}
          AND  j."completedAt" BETWEEN ${from} AND ${to}
        GROUP  BY j.id, j."jobNumber", j."customerName", j."serviceAddress", j."completedAt"
        ORDER  BY SUM(p.amount) DESC
        LIMIT  ${limit}
      `,
    );

    return rows.map((r) => ({
      jobId: r.jobId,
      jobNumber: r.jobNumber,
      customerName: r.customerName,
      serviceAddress: r.serviceAddress,
      completedAt: r.completedAt?.toISOString() ?? '',
      revenue: parseFloat(r.revenue),
    }));
  }

  async getSummary(companyId: string, dto: DateRangeDto): Promise<RevenueSummary> {
    const { from, to } = this.normaliseDateRange(dto);

    const rows = await this.prisma.$queryRaw<
      {
        collected: string;
        totalInvoiced: string;
        outstanding: string;
        overdue: string;
        refunded: string;
      }[]
    >(
      Prisma.sql`
        SELECT
          COALESCE(SUM(CASE WHEN status = 'PAID' THEN total ELSE 0 END), 0)::TEXT             AS collected,
          COALESCE(SUM(total), 0)::TEXT                                                        AS "totalInvoiced",
          COALESCE(SUM(CASE WHEN status IN ('SENT','PARTIALLY_PAID') THEN "balanceDue" ELSE 0 END), 0)::TEXT AS outstanding,
          COALESCE(SUM(CASE WHEN status = 'OVERDUE' THEN "balanceDue" ELSE 0 END), 0)::TEXT   AS overdue,
          0::TEXT                                                                               AS refunded
        FROM   finance."Invoice"
        WHERE  "companyId" = ${companyId}
          AND  "createdAt" BETWEEN ${from} AND ${to}
      `,
    );

    const r = rows[0] ?? {
      collected: '0',
      totalInvoiced: '0',
      outstanding: '0',
      overdue: '0',
      refunded: '0',
    };

    const collected = parseFloat(r.collected);
    const totalInvoiced = parseFloat(r.totalInvoiced);

    return {
      collected,
      outstanding: parseFloat(r.outstanding),
      overdue: parseFloat(r.overdue),
      refunded: parseFloat(r.refunded),
      totalInvoiced,
      collectionRate:
        totalInvoiced > 0 ? Math.round((collected / totalInvoiced) * 100) : 0,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private normaliseDateRange(dto: DateRangeDto): { from: Date; to: Date } {
    const now = new Date();
    return {
      from: dto.from ? new Date(dto.from) : new Date(now.getTime() - 30 * 86_400_000),
      to: dto.to ? new Date(dto.to) : now,
    };
  }

  private granularityToTrunc(g: GranularityEnum): string {
    const map: Record<GranularityEnum, string> = {
      [GranularityEnum.DAY]: 'day',
      [GranularityEnum.WEEK]: 'week',
      [GranularityEnum.MONTH]: 'month',
      [GranularityEnum.QUARTER]: 'quarter',
      [GranularityEnum.YEAR]: 'year',
    };
    return map[g] ?? 'month';
  }
}
