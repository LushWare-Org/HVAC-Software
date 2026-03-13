/**
 * TechnicianMetricsService
 *
 * Performance analytics per technician:
 *  - getLeaderboard()    — ranked by jobs completed, revenue generated, avg rating
 *  - getMetrics()        — detailed metrics for a single technician
 *  - getEfficiency()     — average actual vs scheduled duration, on-time %
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeDto } from '../dashboard/dto/dashboard.dto';
import { Prisma } from '../prisma/generated';

export interface TechnicianLeaderboardEntry {
  technicianId: string;
  technicianName: string;
  jobsCompleted: number;
  revenue: number;
  avgRating: number;
  avgJobDurationMins: number;
  onTimeRate: number;          // % of jobs started within 15 min of scheduledStart
  performanceScore: number;    // composite 0–100
}

export interface TechnicianDetailMetrics {
  technicianId: string;
  technicianName: string;
  jobsCompleted: number;
  jobsCancelled: number;
  revenue: number;
  avgRating: number;
  ratingCount: number;
  avgJobDurationMins: number;
  onTimeRate: number;
  firstTimeFixRate: number;  // jobs with only 1 visit / total
  totalTravelKm: number;
  periodLabel: string;
}

@Injectable()
export class TechnicianMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(
    companyId: string,
    dto: DateRangeDto,
    limit = 20,
  ): Promise<TechnicianLeaderboardEntry[]> {
    const { from, to } = this.normaliseDateRange(dto);

    const rows = await this.prisma.$queryRaw<
      {
        technicianId: string;
        technicianName: string;
        jobs: bigint;
        revenue: string;
        avgRating: string | null;
        avgDuration: string | null;
        onTimeCount: bigint;
        totalWithSchedule: bigint;
      }[]
    >(
      Prisma.sql`
        SELECT
          j."assignedToId"                                                    AS "technicianId",
          j."assignedToName"                                                  AS "technicianName",
          COUNT(j.id)::BIGINT                                                 AS jobs,
          COALESCE(SUM(p.amount), 0)::TEXT                                    AS revenue,
          ROUND(AVG(r.rating)::NUMERIC, 1)::TEXT                             AS "avgRating",
          ROUND(AVG(
            EXTRACT(EPOCH FROM (j."actualEnd" - j."actualStart")) / 60.0
          )::NUMERIC, 0)::TEXT                                                AS "avgDuration",
          COUNT(*) FILTER (
            WHERE j."actualStart" IS NOT NULL
              AND j."scheduledStart" IS NOT NULL
              AND j."actualStart" <= j."scheduledStart" + INTERVAL '15 minutes'
          )::BIGINT                                                            AS "onTimeCount",
          COUNT(*) FILTER (
            WHERE j."scheduledStart" IS NOT NULL
          )::BIGINT                                                            AS "totalWithSchedule"
        FROM   jobs.jobs j
        LEFT   JOIN finance."Invoice" i   ON i."jobId" = j.id
        LEFT   JOIN finance."Payment"  p  ON p."invoiceId" = i.id AND p.status = 'SUCCEEDED'
        LEFT   JOIN crm.reviews       r  ON r."jobId" = j.id
        WHERE  j."companyId" = ${companyId}
          AND  j."assignedToId" IS NOT NULL
          AND  j.status IN ('COMPLETED', 'INVOICED', 'PAID')
          AND  j."completedAt" BETWEEN ${from} AND ${to}
        GROUP  BY j."assignedToId", j."assignedToName"
        ORDER  BY SUM(COALESCE(p.amount, 0)) DESC
        LIMIT  ${limit}
      `,
    );

    return rows.map((r) => {
      const onTimeRate =
        Number(r.totalWithSchedule) > 0
          ? Math.round((Number(r.onTimeCount) / Number(r.totalWithSchedule)) * 100)
          : 0;
      const avgRating = parseFloat(r.avgRating ?? '0');
      const revenue = parseFloat(r.revenue);
      const jobs = Number(r.jobs);

      // Composite score: 40% revenue/job, 30% rating, 30% on-time
      // Normalised to 0-100 (simple heuristic)
      const revenueScore = Math.min(revenue / 1000, 40);
      const ratingScore = avgRating > 0 ? (avgRating / 5) * 30 : 0;
      const onTimeScore = (onTimeRate / 100) * 30;
      const performanceScore = Math.round(revenueScore + ratingScore + onTimeScore);

      return {
        technicianId: r.technicianId,
        technicianName: r.technicianName,
        jobsCompleted: jobs,
        revenue,
        avgRating,
        avgJobDurationMins: parseFloat(r.avgDuration ?? '0'),
        onTimeRate,
        performanceScore,
      };
    });
  }

  async getMetrics(
    companyId: string,
    technicianId: string,
    dto: DateRangeDto,
  ): Promise<TechnicianDetailMetrics> {
    const { from, to } = this.normaliseDateRange(dto);

    const rows = await this.prisma.$queryRaw<
      {
        techName: string;
        completed: bigint;
        cancelled: bigint;
        revenue: string;
        avgRating: string | null;
        ratingCount: bigint;
        avgDuration: string | null;
        onTimeCount: bigint;
        totalScheduled: bigint;
        singleVisitJobs: bigint;
        totalJobs: bigint;
        totalKm: string;
      }[]
    >(
      Prisma.sql`
        SELECT
          MAX(j."assignedToName")                                          AS "techName",
          COUNT(*) FILTER (WHERE j.status IN ('COMPLETED','INVOICED','PAID'))::BIGINT AS completed,
          COUNT(*) FILTER (WHERE j.status = 'CANCELLED')::BIGINT           AS cancelled,
          COALESCE(SUM(p.amount), 0)::TEXT                                 AS revenue,
          ROUND(AVG(r.rating)::NUMERIC, 1)::TEXT                          AS "avgRating",
          COUNT(r.id)::BIGINT                                              AS "ratingCount",
          ROUND(AVG(
            EXTRACT(EPOCH FROM (j."actualEnd" - j."actualStart")) / 60.0
          )::NUMERIC, 0)::TEXT                                             AS "avgDuration",
          COUNT(*) FILTER (
            WHERE j."actualStart" IS NOT NULL
              AND j."scheduledStart" IS NOT NULL
              AND j."actualStart" <= j."scheduledStart" + INTERVAL '15 minutes'
          )::BIGINT                                                         AS "onTimeCount",
          COUNT(*) FILTER (WHERE j."scheduledStart" IS NOT NULL)::BIGINT  AS "totalScheduled",
          (
            SELECT COUNT(DISTINCT sub_j.id)::BIGINT
            FROM   jobs.jobs sub_j
            WHERE  sub_j."assignedToId" = ${technicianId}
              AND  sub_j."companyId" = ${companyId}
              AND  sub_j.status IN ('COMPLETED','INVOICED','PAID')
              AND  sub_j."completedAt" BETWEEN ${from} AND ${to}
              AND  (
                SELECT COUNT(wo.id)
                FROM jobs.work_orders wo
                WHERE wo."jobId" = sub_j.id
              ) = 1
          )                                                                AS "singleVisitJobs",
          COUNT(*) FILTER (WHERE j.status IN ('COMPLETED','INVOICED','PAID'))::BIGINT AS "totalJobs",
          COALESCE(SUM(j."travelDistanceKm"), 0)::TEXT                    AS "totalKm"
        FROM   jobs.jobs j
        LEFT   JOIN finance."Invoice" i ON i."jobId" = j.id
        LEFT   JOIN finance."Payment" p ON p."invoiceId" = i.id AND p.status = 'SUCCEEDED'
        LEFT   JOIN crm.reviews      r ON r."jobId" = j.id
        WHERE  j."companyId"     = ${companyId}
          AND  j."assignedToId"  = ${technicianId}
          AND  j."completedAt" BETWEEN ${from} AND ${to}
        GROUP  BY j."assignedToId"
      `,
    );

    if (!rows.length) {
      return {
        technicianId,
        technicianName: 'Unknown',
        jobsCompleted: 0,
        jobsCancelled: 0,
        revenue: 0,
        avgRating: 0,
        ratingCount: 0,
        avgJobDurationMins: 0,
        onTimeRate: 0,
        firstTimeFixRate: 0,
        totalTravelKm: 0,
        periodLabel: `${from.toLocaleDateString()} – ${to.toLocaleDateString()}`,
      };
    }

    const r = rows[0];
    const onTimeRate =
      Number(r.totalScheduled) > 0
        ? Math.round((Number(r.onTimeCount) / Number(r.totalScheduled)) * 100)
        : 0;
    const firstTimeFixRate =
      Number(r.totalJobs) > 0
        ? Math.round((Number(r.singleVisitJobs) / Number(r.totalJobs)) * 100)
        : 0;

    return {
      technicianId,
      technicianName: r.techName,
      jobsCompleted: Number(r.completed),
      jobsCancelled: Number(r.cancelled),
      revenue: parseFloat(r.revenue),
      avgRating: parseFloat(r.avgRating ?? '0'),
      ratingCount: Number(r.ratingCount),
      avgJobDurationMins: parseFloat(r.avgDuration ?? '0'),
      onTimeRate,
      firstTimeFixRate,
      totalTravelKm: parseFloat(r.totalKm),
      periodLabel: `${from.toLocaleDateString()} – ${to.toLocaleDateString()}`,
    };
  }

  private normaliseDateRange(dto: DateRangeDto): { from: Date; to: Date } {
    const now = new Date();
    return {
      from: dto.from ? new Date(dto.from) : new Date(now.getTime() - 30 * 86_400_000),
      to: dto.to ? new Date(dto.to) : now,
    };
  }
}
