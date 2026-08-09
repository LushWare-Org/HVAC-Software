import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../prisma/generated';
import type { PendingQuoteFacts, RetentionFacts, UtilizationFacts } from './insight-types';

// Exported so InsightExplanationService can describe these thresholds in the "Reason" breakdown
// without duplicating the numbers.
export const HIGH_VALUE_LTV_THRESHOLD = 2000; // annual active-agreement value considered "high value"
export const CHURN_RISK_MIN_PROBABILITY = 0.4; // mirrors CustomersService.riskLevel's "Medium" cutoff
export const PENDING_QUOTE_AGING_DAYS = 7; // mirrors RevenueRuleEngine's PENDING_QUOTE_DAYS

/**
 * Real cross-schema reads backing the AI Revenue Recommendations panel.
 * Every method returns actual data from crm/jobs/finance/scheduling — no
 * mock arrays. Each is independently resilient: a query failure (e.g. a
 * table not yet migrated in some environment) throws, and the caller
 * treats that single category as "no signal" rather than failing the
 * whole panel.
 */
@Injectable()
export class InsightDataService {
  private readonly logger = new Logger(InsightDataService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Demand vs. technician capacity over the forecast window — backs both low_demand and high_utilization. */
  async getUtilizationFacts(companyId: string, forecastDays: number): Promise<UtilizationFacts> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + forecastDays * 86_400_000);

    const [capacityRows, demandRows] = await Promise.all([
      this.prisma.$queryRaw<{ active_technicians: bigint; capacity: bigint }[]>(
        Prisma.sql`
          SELECT COUNT(*)::BIGINT AS active_technicians,
                 COALESCE(SUM(max_daily_jobs), 0)::BIGINT AS capacity
          FROM   scheduling.technicians
          WHERE  company_id = ${companyId} AND is_active = true
        `,
      ),
      this.prisma.$queryRaw<{ scheduled_jobs: bigint; avg_job_value: string | null }[]>(
        Prisma.sql`
          SELECT
            (SELECT COUNT(*) FROM jobs.jobs
              WHERE "companyId" = ${companyId}
                AND "scheduledStart" >= ${now} AND "scheduledStart" < ${windowEnd}
                AND status NOT IN ('CANCELLED'))::BIGINT AS scheduled_jobs,
            (SELECT AVG("estimatedValue") FROM jobs.jobs
              WHERE "companyId" = ${companyId}
                AND "completedAt" >= ${new Date(now.getTime() - 30 * 86_400_000)}
                AND "estimatedValue" IS NOT NULL)::TEXT AS avg_job_value
        `,
      ),
    ]);

    const activeTechnicians = Number(capacityRows[0]?.active_technicians ?? 0);
    const capacityPerDay = Number(capacityRows[0]?.capacity ?? 0);

    return {
      activeTechnicians,
      capacity: capacityPerDay * forecastDays,
      scheduledJobs: Number(demandRows[0]?.scheduled_jobs ?? 0),
      avgJobValue: demandRows[0]?.avg_job_value ? Number(demandRows[0].avg_job_value) : 0,
    };
  }

  /** Aggregate churn-risk classification (mirrors CustomersService.classifyChurnAndFailureRisk's churn formula) applied per customer, joined to real agreement value. */
  async getRetentionFacts(companyId: string): Promise<RetentionFacts> {
    const rows = await this.prisma.$queryRaw<
      { days_since_last_service: number; services_last_year: number; tenure_days: number; ltv: string }[]
    >(
      Prisma.sql`
        SELECT
          COALESCE(EXTRACT(DAY FROM NOW() - MAX(j."completedAt"))::INT, 9999) AS days_since_last_service,
          COUNT(j.id) FILTER (WHERE j."completedAt" >= NOW() - INTERVAL '365 days')::INT AS services_last_year,
          EXTRACT(DAY FROM NOW() - c."createdAt")::INT AS tenure_days,
          COALESCE((
            SELECT SUM(sa.value) FROM crm.service_agreements sa
            WHERE sa."customerId" = c.id AND sa.status = 'ACTIVE'
          ), 0)::TEXT AS ltv
        FROM crm.customers c
        LEFT JOIN jobs.jobs j ON j."customerId" = c.id AND j.status = 'COMPLETED'
        WHERE c."companyId" = ${companyId} AND c."isActive" = true
        GROUP BY c.id, c."createdAt"
      `,
    );

    let atRiskHighValueCount = 0;
    let totalLtvAtRisk = 0;

    for (const row of rows) {
      const ltv = Number(row.ltv);
      if (ltv < HIGH_VALUE_LTV_THRESHOLD) continue;

      const churnProbability = Math.min(
        0.95,
        (row.days_since_last_service > 180 ? 0.45 : row.days_since_last_service > 90 ? 0.25 : 0.08) +
          (row.services_last_year === 0 ? 0.25 : 0) +
          (row.tenure_days < 90 ? 0.08 : 0),
      );

      if (churnProbability >= CHURN_RISK_MIN_PROBABILITY) {
        atRiskHighValueCount += 1;
        totalLtvAtRisk += ltv;
      }
    }

    const historicalSuccessRate = await this.getHistoricalRetentionSuccessRate(companyId);

    return {
      atRiskHighValueCount,
      avgLtvAtRisk: atRiskHighValueCount > 0 ? Number((totalLtvAtRisk / atRiskHighValueCount).toFixed(2)) : 0,
      totalLtvAtRisk: Number(totalLtvAtRisk.toFixed(2)),
      historicalSuccessRate,
    };
  }

  /** Aging (>7 day) pending quotes and the company's real historical close rate, when there's enough closed history to compute one. */
  async getPendingQuoteFacts(companyId: string): Promise<PendingQuoteFacts> {
    const agingCutoff = new Date(Date.now() - PENDING_QUOTE_AGING_DAYS * 86_400_000);

    const rows = await this.prisma.$queryRaw<
      { aging_count: bigint; aging_total: string | null; won_count: bigint; closed_count: bigint }[]
    >(
      Prisma.sql`
        SELECT
          COUNT(*) FILTER (WHERE status IN ('SENT','VIEWED') AND "createdAt" < ${agingCutoff})::BIGINT AS aging_count,
          COALESCE(SUM(total) FILTER (WHERE status IN ('SENT','VIEWED') AND "createdAt" < ${agingCutoff}), 0)::TEXT AS aging_total,
          COUNT(*) FILTER (WHERE status IN ('ACCEPTED','CONVERTED') AND "createdAt" >= NOW() - INTERVAL '180 days')::BIGINT AS won_count,
          COUNT(*) FILTER (WHERE status IN ('ACCEPTED','CONVERTED','DECLINED','EXPIRED') AND "createdAt" >= NOW() - INTERVAL '180 days')::BIGINT AS closed_count
        FROM finance."Quote"
        WHERE "companyId" = ${companyId}
      `,
    );

    const row = rows[0];
    const closedCount = Number(row?.closed_count ?? 0);
    const wonCount = Number(row?.won_count ?? 0);

    return {
      agingPendingCount: Number(row?.aging_count ?? 0),
      agingPendingTotal: row?.aging_total ? Number(row.aging_total) : 0,
      historicalConversionRate: closedCount > 0 ? Number((wonCount / closedCount).toFixed(3)) : null,
    };
  }

  private async getHistoricalRetentionSuccessRate(companyId: string): Promise<number | null> {
    try {
      const rows = await this.prisma.$queryRaw<{ successes: bigint; responded: bigint }[]>(
        Prisma.sql`
          SELECT
            COUNT(*) FILTER (WHERE retention_success = true)::BIGINT AS successes,
            COUNT(*) FILTER (WHERE responded_at IS NOT NULL)::BIGINT AS responded
          FROM crm.retention_recommendations
          WHERE company_id = ${companyId} AND created_at >= NOW() - INTERVAL '180 days'
        `,
      );
      const responded = Number(rows[0]?.responded ?? 0);
      if (responded === 0) return null;
      return Number((Number(rows[0]?.successes ?? 0) / responded).toFixed(3));
    } catch (error) {
      this.logger.debug(`Historical retention success rate unavailable: ${error instanceof Error ? error.message : 'unknown error'}`);
      return null;
    }
  }
}
