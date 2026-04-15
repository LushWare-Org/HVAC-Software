import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ChurnClient } from '../ai/churn.client';
import { UpsellClient, type UpsellRecommendationInput, type UpsellRecommendationResult } from '../ai/upsell.client';
import { FollowupProducer } from '../queues/followup.producer';

type TriggerSource = 'service_completion' | 'daily_batch' | 'profile_update' | 'manual';

export interface UpsellRunSummary {
  processed: number;
  recommended: number;
  skipped: number;
  failures: number;
}

interface CustomerCandidate {
  id: string;
  companyId: string;
  type: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  createdAt: Date;
  equipment: Array<{ installDate: Date | null; createdAt: Date }>;
  bookings: Array<{ preferredDate: Date }>;
  agreements: Array<{ value: unknown }>;
  reviews: Array<{ rating: number }>;
  _count: { equipment: number };
}

@Injectable()
export class UpsellAgentService {
  private readonly logger = new Logger(UpsellAgentService.name);
  private recommendationsTableExists?: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly churnClient: ChurnClient,
    private readonly upsellClient: UpsellClient,
    private readonly followupProducer: FollowupProducer,
  ) {}

  async runDailyBatch(): Promise<UpsellRunSummary> {
    const summary: UpsellRunSummary = {
      processed: 0,
      recommended: 0,
      skipped: 0,
      failures: 0,
    };

    const customers = await this.loadBatchCandidates();
    for (const customer of customers) {
      summary.processed += 1;
      const result = await this.processCandidate(customer, 'daily_batch');
      summary[result] += 1;
    }

    return summary;
  }

  async recommendForCustomer(companyId: string, customerId: string, triggerSource: TriggerSource = 'manual') {
    const customer = await this.loadCustomer(companyId, customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const result = await this.processCandidate(customer, triggerSource, true);
    return { status: result };
  }

  async processCustomerProfileUpdate(companyId: string, customerId: string): Promise<void> {
    try {
      await this.recommendForCustomer(companyId, customerId, 'profile_update');
    } catch (error) {
      this.logger.warn(`Upsell profile-update trigger failed for customer ${customerId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processServiceCompletion(companyId: string, customerId: string): Promise<void> {
    try {
      await this.recommendForCustomer(companyId, customerId, 'service_completion');
    } catch (error) {
      this.logger.warn(`Upsell service-completion trigger failed for customer ${customerId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listRecommendations(companyId: string, limit = 50) {
    if (!(await this.hasRecommendationsTable())) {
      return [];
    }

    return this.prisma.$queryRawUnsafe(
      `
        SELECT
          id,
          customer_id AS "customerId",
          recommended_offer AS "recommendedOffer",
          confidence,
          status,
          all_scores AS "allScores",
          trigger_source AS "triggerSource",
          priority_score AS "priorityScore",
          created_at AS "createdAt"
        FROM ${this.prisma.tableRef('upsell_recommendations')}
        WHERE company_id = $1
        ORDER BY priority_score DESC, created_at DESC
        LIMIT $2
      `,
      companyId,
      limit,
    );
  }

  private async processCandidate(
    customer: CustomerCandidate,
    triggerSource: TriggerSource,
    force = false,
  ): Promise<keyof UpsellRunSummary> {
    if (!force && await this.hasRecentRecommendation(customer.companyId, customer.id)) {
      return 'skipped';
    }

    const payload = await this.buildPayload(customer);
    let recommendation: UpsellRecommendationResult;

    try {
      recommendation = await this.upsellClient.recommendOffer(payload);
    } catch (error) {
      this.logger.warn(`Upsell model unavailable for customer ${customer.id}; using local recommendation rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
      recommendation = this.recommendWithLocalRules(payload);
    }

    await this.saveRecommendation(customer, recommendation, triggerSource, payload);

    if (recommendation.confidence > 0.75) {
      await this.triggerFollowUp(customer, recommendation);
    }

    return 'recommended';
  }

  private async buildPayload(customer: CustomerCandidate): Promise<UpsellRecommendationInput> {
    const now = new Date();
    const lastServiceDays = this.computeDaysSinceLastService(customer.bookings, customer.createdAt, now);
    const serviceCountLastYear = this.computeServiceCountLastYear(customer.bookings, now);
    const equipmentAgeDays = this.computeEquipmentAgeDays(customer.equipment, now);
    const avgSpend = this.computeAverageMonthlySpend(customer.agreements);
    const failureCount = customer.reviews.filter((review) => review.rating <= 2).length;

    const payload: UpsellRecommendationInput = {
      equipment_age: Number((equipmentAgeDays / 365).toFixed(2)),
      failure_count: failureCount,
      last_service_days: lastServiceDays,
      avg_spend: avgSpend,
      usage_hours_per_week: customer.type === 'COMMERCIAL' ? 60 : 20,
    };

    try {
      const risk = await this.churnClient.predictRevenue({
        churn: {
          days_since_last_service: lastServiceDays,
          service_count_last_year: serviceCountLastYear,
          avg_monthly_spend: avgSpend,
          customer_tenure_days: this.computeDaysBetween(customer.createdAt, now),
        },
        failure: {
          equipment_age_days: equipmentAgeDays,
          days_since_last_service: lastServiceDays,
          service_count_last_year: serviceCountLastYear,
          usage_intensity: Math.max(1, serviceCountLastYear + customer._count.equipment),
          failure_history: failureCount,
        },
      });

      payload.churn_probability = risk.churn_probability;
      payload.failure_risk = risk.failure_probability;
    } catch (error) {
      this.logger.warn(`Risk enrichment unavailable for customer ${customer.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return payload;
  }

  private recommendWithLocalRules(payload: UpsellRecommendationInput): UpsellRecommendationResult {
    const scores: Record<string, number> = {
      maintenance_plan: 0.25,
      replacement: 0.2,
      service: 0.2,
    };

    let ruleOffer: string | null = null;

    if (payload.equipment_age > 8) {
      scores.replacement += 0.45;
      ruleOffer = 'replacement';
    }

    if (payload.failure_count > 2) {
      scores.maintenance_plan += 0.45;
      ruleOffer ??= 'maintenance_plan';
    }

    if (payload.last_service_days > 180) {
      scores.service += 0.4;
      ruleOffer ??= 'service';
    }

    if (payload.failure_risk && payload.failure_risk >= 0.5) {
      scores.maintenance_plan += 0.15;
      scores.replacement += payload.equipment_age > 8 ? 0.1 : 0;
    }

    if (payload.churn_probability && payload.churn_probability >= 0.5) {
      scores.maintenance_plan += 0.1;
      scores.service += 0.1;
    }

    if (payload.avg_spend >= 250) {
      scores.maintenance_plan += 0.08;
    }

    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const normalizedScores = Object.fromEntries(
      Object.entries(scores).map(([offer, score]) => [offer, Number((score / total).toFixed(4))]),
    );
    const [recommendedOffer, confidence] = Object.entries(normalizedScores)
      .sort(([, left], [, right]) => right - left)[0];
    const priorityScore = Math.min(
      1,
      (confidence * 0.7)
        + ((payload.churn_probability ?? 0) * 0.15)
        + ((payload.failure_risk ?? 0) * 0.15),
    );

    return {
      recommended_offer: recommendedOffer,
      confidence,
      all_scores: normalizedScores,
      rule_offer: ruleOffer,
      model_offer: 'local_rules',
      priority_score: Number(priorityScore.toFixed(4)),
    };
  }

  private async saveRecommendation(
    customer: CustomerCandidate,
    recommendation: UpsellRecommendationResult,
    triggerSource: TriggerSource,
    payload: UpsellRecommendationInput,
  ): Promise<void> {
    if (!(await this.hasRecommendationsTable())) {
      this.logger.warn('upsell_recommendations table is missing; recommendation was generated but not persisted');
      return;
    }

    await this.prisma.$executeRawUnsafe(
      `
        INSERT INTO ${this.prisma.tableRef('upsell_recommendations')} (
          id,
          company_id,
          customer_id,
          recommended_offer,
          confidence,
          status,
          all_scores,
          rule_offer,
          model_offer,
          trigger_source,
          priority_score,
          input_payload,
          created_at,
          updated_at
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          'pending',
          CAST($6 AS JSONB),
          $7,
          $8,
          $9,
          $10,
          CAST($11 AS JSONB),
          NOW(),
          NOW()
        )
      `,
      randomUUID(),
      customer.companyId,
      customer.id,
      recommendation.recommended_offer,
      recommendation.confidence,
      JSON.stringify(recommendation.all_scores),
      recommendation.rule_offer ?? null,
      recommendation.model_offer ?? null,
      triggerSource,
      recommendation.priority_score,
      JSON.stringify(payload),
    );
  }

  private async triggerFollowUp(customer: CustomerCandidate, recommendation: UpsellRecommendationResult): Promise<void> {
    const recipientPhone = customer.mobile ?? customer.phone;
    const recipientEmail = customer.email;

    if (!recipientPhone && !recipientEmail) {
      this.logger.warn(`Skipping upsell follow-up for customer ${customer.id}; no contact channel available`);
      return;
    }

    await this.followupProducer.enqueueFollowup({
      companyId: customer.companyId,
      entityType: 'customer',
      entityId: customer.id,
      customerId: customer.id,
      recipientId: customer.id,
      recipientName: `${customer.firstName} ${customer.lastName}`.trim(),
      recipientPhone: recipientPhone ?? undefined,
      recipientEmail: recipientEmail ?? undefined,
      action: 'UPSELL',
      reason: `Recommended ${recommendation.recommended_offer} with confidence ${recommendation.confidence.toFixed(3)}`,
      triggeredAt: new Date().toISOString(),
    });
  }

  private async loadBatchCandidates(): Promise<CustomerCandidate[]> {
    return this.prisma.customer.findMany({
      where: {
        isActive: true,
        NOT: {
          AND: [
            { source: 'portal' },
            { engagementStatus: 'INACTIVE' },
            { tags: { has: 'portal-signup' } },
          ],
        },
      },
      take: Number(process.env.UPSELL_BATCH_LIMIT ?? 250),
      orderBy: { updatedAt: 'desc' },
      include: this.customerInclude(),
    });
  }

  private async loadCustomer(companyId: string, customerId: string): Promise<CustomerCandidate | null> {
    return this.prisma.customer.findFirst({
      where: { id: customerId, companyId, isActive: true },
      include: this.customerInclude(),
    });
  }

  private customerInclude() {
    return {
      equipment: {
        orderBy: [{ installDate: 'asc' as const }, { createdAt: 'asc' as const }],
        select: { installDate: true, createdAt: true },
      },
      bookings: {
        where: { status: { in: ['CONFIRMED' as const, 'CONVERTED' as const] } },
        orderBy: { preferredDate: 'desc' as const },
        take: 24,
        select: { preferredDate: true },
      },
      agreements: {
        where: { status: 'ACTIVE' as const },
        select: { value: true },
      },
      reviews: {
        orderBy: { createdAt: 'desc' as const },
        take: 24,
        select: { rating: true },
      },
      _count: { select: { equipment: true } },
    };
  }

  private async hasRecommendationsTable(): Promise<boolean> {
    if (this.recommendationsTableExists !== undefined) {
      return this.recommendationsTableExists;
    }

    this.recommendationsTableExists = await this.prisma.tableExists('upsell_recommendations');
    if (!this.recommendationsTableExists) {
      this.logger.warn('upsell_recommendations table is missing; run CRM migrations to persist upsell recommendations');
    }

    return this.recommendationsTableExists;
  }

  private async hasRecentRecommendation(companyId: string, customerId: string): Promise<boolean> {
    if (!(await this.hasRecommendationsTable())) {
      return false;
    }

    const rows = await this.prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `
        SELECT COUNT(*)::INT AS count
        FROM ${this.prisma.tableRef('upsell_recommendations')}
        WHERE company_id = $1
          AND customer_id = $2
          AND status = 'pending'
          AND created_at >= NOW() - INTERVAL '7 days'
      `,
      companyId,
      customerId,
    );

    return Number(rows[0]?.count ?? 0) > 0;
  }

  private computeDaysSinceLastService(bookings: Array<{ preferredDate: Date }>, fallbackDate: Date, now: Date): number {
    return this.computeDaysBetween(bookings[0]?.preferredDate ?? fallbackDate, now);
  }

  private computeServiceCountLastYear(bookings: Array<{ preferredDate: Date }>, now: Date): number {
    const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
    return bookings.filter((booking) => booking.preferredDate >= oneYearAgo).length;
  }

  private computeAverageMonthlySpend(agreements: Array<{ value: unknown }>): number {
    const annualValue = agreements.reduce((sum, agreement) => sum + Number(agreement.value ?? 0), 0);
    return annualValue > 0 ? Number((annualValue / 12).toFixed(2)) : 0;
  }

  private computeEquipmentAgeDays(equipment: Array<{ installDate: Date | null; createdAt: Date }>, now: Date): number {
    if (equipment.length === 0) return 0;
    const oldestKnownDate = equipment[0].installDate ?? equipment[0].createdAt;
    return this.computeDaysBetween(oldestKnownDate, now);
  }

  private computeDaysBetween(start: Date, end: Date): number {
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
  }
}
