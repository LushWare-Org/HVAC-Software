/**
 * JobsAnalyticsService
 *
 * Job volume and performance analytics:
 *  - getByStatus()     — count of jobs per status in the period
 *  - getByTradeType()  — volume + revenue per job type (HVAC, Plumbing, …)
 *  - getByZone()       — jobs and revenue grouped by service city/zip
 *  - getCompletionRate()— completion, cancellation and on-hold rates
 *  - getTrends()       — job volume time-series for trending chart
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../redis-cache.service';
import { DateRangeDto, GranularityEnum } from '../dashboard/dto/dashboard.dto';
import { Prisma } from '../prisma/generated';

export interface JobsByStatus {
  status: string;
  count: number;
}

export interface JobsByTrade {
  tradeType: string;
  tradeSlug: string;
  jobCount: number;
  revenue: number;
  avgRating: number;
  completionRate: number;
}

export interface JobsByZone {
  city: string;
  state: string;
  zipCode: string;
  jobCount: number;
  revenue: number;
}

export interface JobCompletionRates {
  totalJobs: number;
  completed: number;
  cancelled: number;
  onHold: number;
  completionRate: number;
  cancellationRate: number;
}

export interface JobVolumeTrend {
  period: string;
  created: number;
  completed: number;
  cancelled: number;
}

@Injectable()
export class JobsAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async getByStatus(companyId: string, dto: DateRangeDto): Promise<JobsByStatus[]> {
    const { from, to } = this.normaliseDateRange(dto);

    // 2-min cache: status counts only shift when jobs transition; this aligns
    // with the dashboard's KPI cache window so the pie chart and KPIs don't
    // read different point-in-time snapshots of the same period.
    const cacheKey = `analytics:jobs-by-status:${companyId}:${from.toISOString()}:${to.toISOString()}`;
    const cached = await this.cache.get<JobsByStatus[]>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.$queryRaw<{ status: string; cnt: bigint }[]>(
      Prisma.sql`
        SELECT status::TEXT, COUNT(*)::BIGINT AS cnt
        FROM   jobs.jobs
        WHERE  "companyId" = ${companyId}
          AND  "createdAt" BETWEEN ${from} AND ${to}
        GROUP  BY status
        ORDER  BY COUNT(*) DESC
      `,
    );

    const result = rows.map((r) => ({ status: r.status, count: Number(r.cnt) }));
    await this.cache.set(cacheKey, result, 120);
    return result;
  }

  async getByTradeType(companyId: string, dto: DateRangeDto): Promise<JobsByTrade[]> {
    const { from, to } = this.normaliseDateRange(dto);

    const rows = await this.prisma.$queryRaw<
      {
        tradeType: string;
        tradeSlug: string;
        jobCount: bigint;
        revenue: string;
        avgRating: string | null;
        completed: bigint;
      }[]
    >(
      Prisma.sql`
        SELECT
          jt.name::TEXT                                            AS "tradeType",
          jt.slug::TEXT                                            AS "tradeSlug",
          COUNT(j.id)::BIGINT                                      AS "jobCount",
          COALESCE(SUM(p.amount), 0)::TEXT                         AS revenue,
          ROUND(AVG(r.rating)::NUMERIC, 1)::TEXT                  AS "avgRating",
          COUNT(j.id) FILTER (
            WHERE j.status IN ('COMPLETED','INVOICED','PAID')
          )::BIGINT                                                AS completed
        FROM   jobs.jobs j
        JOIN   jobs.job_types jt ON jt.id = j."jobTypeId"
        LEFT   JOIN finance."Invoice" i ON i."jobId" = j.id
        LEFT   JOIN finance."Payment" p ON p."invoiceId" = i.id AND p.status = 'SUCCEEDED'
        LEFT   JOIN crm.reviews      r ON r."jobId" = j.id
        WHERE  j."companyId" = ${companyId}
          AND  j."createdAt" BETWEEN ${from} AND ${to}
        GROUP  BY jt.id, jt.name, jt.slug
        ORDER  BY COUNT(j.id) DESC
      `,
    );

    return rows.map((r) => {
      const jobCount = Number(r.jobCount);
      const completed = Number(r.completed);
      return {
        tradeType: r.tradeType,
        tradeSlug: r.tradeSlug,
        jobCount,
        revenue: parseFloat(r.revenue),
        avgRating: parseFloat(r.avgRating ?? '0'),
        completionRate: jobCount > 0 ? Math.round((completed / jobCount) * 100) : 0,
      };
    });
  }

  async getByZone(
    companyId: string,
    dto: DateRangeDto,
    groupBy: 'city' | 'zip' = 'city',
  ): Promise<JobsByZone[]> {
    const { from, to } = this.normaliseDateRange(dto);

    const rows = await this.prisma.$queryRaw<
      {
        city: string;
        state: string;
        zip: string;
        jobCount: bigint;
        revenue: string;
      }[]
    >(
      Prisma.sql`
        SELECT
          COALESCE(j."serviceCity", 'Unknown')  AS city,
          COALESCE(j."serviceState", '')        AS state,
          COALESCE(j."serviceZip", '')          AS zip,
          COUNT(j.id)::BIGINT                   AS "jobCount",
          COALESCE(SUM(p.amount), 0)::TEXT      AS revenue
        FROM   jobs.jobs j
        LEFT   JOIN finance."Invoice" i ON i."jobId" = j.id
        LEFT   JOIN finance."Payment" p ON p."invoiceId" = i.id AND p.status = 'SUCCEEDED'
        WHERE  j."companyId" = ${companyId}
          AND  j."createdAt" BETWEEN ${from} AND ${to}
        GROUP  BY j."serviceCity", j."serviceState", j."serviceZip"
        ORDER  BY COUNT(j.id) DESC
        LIMIT  50
      `,
    );

    return rows.map((r) => ({
      city: r.city,
      state: r.state,
      zipCode: r.zip,
      jobCount: Number(r.jobCount),
      revenue: parseFloat(r.revenue),
    }));
  }

  async getCompletionRates(companyId: string, dto: DateRangeDto): Promise<JobCompletionRates> {
    const { from, to } = this.normaliseDateRange(dto);

    const rows = await this.prisma.$queryRaw<
      { total: bigint; completed: bigint; cancelled: bigint; onHold: bigint }[]
    >(
      Prisma.sql`
        SELECT
          COUNT(*)::BIGINT                                                   AS total,
          COUNT(*) FILTER (WHERE status IN ('COMPLETED','INVOICED','PAID'))::BIGINT AS completed,
          COUNT(*) FILTER (WHERE status = 'CANCELLED')::BIGINT              AS cancelled,
          COUNT(*) FILTER (WHERE status = 'ON_HOLD')::BIGINT                AS "onHold"
        FROM   jobs.jobs
        WHERE  "companyId" = ${companyId}
          AND  "createdAt" BETWEEN ${from} AND ${to}
      `,
    );

    const r = rows[0] ?? { total: 0n, completed: 0n, cancelled: 0n, onHold: 0n };
    const total = Number(r.total);
    const completed = Number(r.completed);
    const cancelled = Number(r.cancelled);
    const onHold = Number(r.onHold);

    return {
      totalJobs: total,
      completed,
      cancelled,
      onHold,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
    };
  }

  async getTrends(
    companyId: string,
    dto: DateRangeDto,
    granularity: GranularityEnum = GranularityEnum.WEEK,
  ): Promise<JobVolumeTrend[]> {
    const { from, to } = this.normaliseDateRange(dto);
    const trunc = this.granularityToTrunc(granularity);

    const rows = await this.prisma.$queryRaw<
      { period: Date; created: bigint; completed: bigint; cancelled: bigint }[]
    >(
      Prisma.sql`
        SELECT
          DATE_TRUNC(${trunc}, "createdAt")                                  AS period,
          COUNT(*)::BIGINT                                                    AS created,
          COUNT(*) FILTER (WHERE status IN ('COMPLETED','INVOICED','PAID'))::BIGINT AS completed,
          COUNT(*) FILTER (WHERE status = 'CANCELLED')::BIGINT               AS cancelled
        FROM   jobs.jobs
        WHERE  "companyId" = ${companyId}
          AND  "createdAt" BETWEEN ${from} AND ${to}
        GROUP  BY 1
        ORDER  BY 1
      `,
    );

    return rows.map((r) => ({
      period: r.period.toISOString().slice(0, 10),
      created: Number(r.created),
      completed: Number(r.completed),
      cancelled: Number(r.cancelled),
    }));
  }

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
    return map[g] ?? 'week';
  }
}
