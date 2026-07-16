import { Injectable, Logger } from '@nestjs/common';
import type { RetentionAction, RetentionDecisionAudit } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { RetentionDecisionService, type RetentionDecisionRequest } from '../retention/decision/retention-decision.service';

const RECOMMENDATION_TTL_MS = 24 * 60 * 60 * 1000; // regenerate at most once per day per customer
const SAME_OFFER_WINDOW_DAYS = 30;
const PREMIUM_ANNUAL_SPEND = 2400;
const STANDARD_ANNUAL_SPEND = 600;

export interface RetentionRecommendationRecord {
  id: string;
  action: RetentionAction;
  offer: { type: string; discount: number };
  priority: 'low' | 'medium' | 'high';
  channel: string | null;
  reason: string;
  message: string | null;
  confidence: number | null;
  createdAt: Date;
}

interface CustomerRetentionCandidate {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  notes: string | null;
  automaticFollowupEnabled: boolean;
  bookings: Array<{ preferredDate: Date; status: string }>;
  agreements: Array<{ status: string; endDate: Date | null; value: unknown }>;
  equipment: Array<{ installDate: Date | null }>;
  reviews: Array<{ rating: number }>;
}

/**
 * Generates and caches retention recommendations via the rule-based + LLM
 * decision pipeline (RetentionRuleEngine -> RetentionContextBuilder ->
 * RetentionLlmClient -> RetentionValidationService). Recommendations are
 * persisted to retention_recommendations so:
 *   1. The dashboard reads a cached decision instead of paying LLM latency
 *      on every status-summary request (mirrors the upsell_recommendations
 *      cache-aside pattern already used by CustomersService).
 *   2. Every decision is a feedback-log row that can later train an ML
 *      replacement for the rule engine (see docs/retention-agent.md).
 */
@Injectable()
export class RetentionAgent {
  private readonly logger = new Logger(RetentionAgent.name);
  private tableExists?: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly decisionService: RetentionDecisionService,
  ) {}

  /** Returns the cached recommendation if still fresh, otherwise regenerates and persists a new one. */
  async ensureRecommendation(companyId: string, customerId: string): Promise<RetentionRecommendationRecord | null> {
    const cached = await this.getLatestRecommendation(companyId, customerId);
    if (cached && Date.now() - cached.createdAt.getTime() < RECOMMENDATION_TTL_MS) {
      return cached;
    }

    return this.generateRecommendation(companyId, customerId);
  }

  async generateRecommendation(companyId: string, customerId: string): Promise<RetentionRecommendationRecord | null> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId, isActive: true },
      select: {
        id: true, companyId: true, firstName: true, lastName: true,
        email: true, phone: true, mobile: true, notes: true, automaticFollowupEnabled: true,
        bookings: {
          where: { status: { in: ['CONFIRMED', 'CONVERTED'] } },
          orderBy: { preferredDate: 'desc' },
          take: 48,
          select: { preferredDate: true, status: true },
        },
        agreements: { orderBy: { updatedAt: 'desc' }, take: 5, select: { status: true, endDate: true, value: true } },
        equipment: { select: { installDate: true } },
        reviews: { select: { rating: true } },
      },
    });

    if (!customer) {
      return null;
    }

    const request = await this.buildDecisionRequest(customer as CustomerRetentionCandidate);
    const decision = await this.decisionService.decide(request);

    const record: RetentionRecommendationRecord = {
      id: '',
      action: decision.action,
      offer: decision.offer,
      priority: decision.priority,
      channel: decision.channel,
      reason: decision.reason,
      message: decision.message,
      confidence: decision.llmConfidence,
      createdAt: new Date(),
    };

    record.id = await this.persistRecommendation(companyId, customerId, decision.audit, record);
    return record;
  }

  private async buildDecisionRequest(customer: CustomerRetentionCandidate): Promise<RetentionDecisionRequest> {
    const now = new Date();
    const daysSinceLastService = this.computeDaysSinceLastService(customer.bookings, now);
    const repairCount12Months = customer.bookings.filter(
      (booking) => this.daysBetween(booking.preferredDate, now) <= 365,
    ).length;
    const complaintCount = customer.reviews.filter((review) => review.rating <= 2).length;
    const averageAnnualSpend = this.computeAverageAnnualSpend(customer.agreements);
    const activeContracts = customer.agreements.filter((agreement) => agreement.status === 'ACTIVE').length;
    const latestAgreement = customer.agreements[0];
    const recipientPhone = customer.mobile ?? customer.phone;
    const recipientEmail = customer.email;

    const previousRetentionAttempts = await this.countPreviousRetentionAttempts(customer.companyId, customer.id);
    const sameOfferRecentlySent = await this.hasSameOfferRecently(customer.companyId, customer.id);

    return {
      customerId: customer.id,
      companyId: customer.companyId,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      customerSegment: this.deriveSegment(averageAnnualSpend),
      averageAnnualSpend,
      engagementTrend: this.deriveEngagementTrend(customer.bookings, now),
      agreementStatus: latestAgreement?.status,
      agreementEndDate: latestAgreement?.endDate ? latestAgreement.endDate.toISOString() : null,
      daysSinceLastService,
      repairCount12Months,
      complaintCount,
      automaticFollowupEnabled: customer.automaticFollowupEnabled,
      previousRetentionAttempts,
      sameOfferRecentlySent,
      recipientPhone: recipientPhone ?? undefined,
      recipientEmail: recipientEmail ?? undefined,
      equipmentAge: this.computeOldestEquipmentAgeYears(customer.equipment),
      activeContracts,
      notes: customer.notes ?? undefined,
    };
  }

  private deriveSegment(averageAnnualSpend: number): 'premium' | 'standard' | 'budget' {
    if (averageAnnualSpend >= PREMIUM_ANNUAL_SPEND) return 'premium';
    if (averageAnnualSpend >= STANDARD_ANNUAL_SPEND) return 'standard';
    return 'budget';
  }

  private deriveEngagementTrend(
    bookings: Array<{ preferredDate: Date }>,
    now: Date,
  ): 'increasing' | 'stable' | 'decreasing' {
    const recentCount = bookings.filter((booking) => this.daysBetween(booking.preferredDate, now) <= 180).length;
    const priorCount = bookings.filter((booking) => {
      const age = this.daysBetween(booking.preferredDate, now);
      return age > 180 && age <= 365;
    }).length;

    if (recentCount < priorCount) return 'decreasing';
    if (recentCount > priorCount) return 'increasing';
    return 'stable';
  }

  private computeAverageAnnualSpend(agreements: Array<{ status: string; value: unknown }>): number {
    const annualValue = agreements
      .filter((agreement) => agreement.status === 'ACTIVE')
      .reduce((sum, agreement) => sum + Number(agreement.value ?? 0), 0);
    return Number(annualValue.toFixed(2));
  }

  private computeOldestEquipmentAgeYears(equipment: Array<{ installDate: Date | null }>): number | undefined {
    const ages = equipment
      .filter((item) => item.installDate)
      .map((item) => (Date.now() - item.installDate!.getTime()) / (365 * 24 * 60 * 60 * 1000));
    if (ages.length === 0) return undefined;
    return Number(Math.max(...ages).toFixed(1));
  }

  private computeDaysSinceLastService(bookings: Array<{ preferredDate: Date }>, now: Date): number {
    if (bookings.length === 0) return 9999;
    return this.daysBetween(bookings[0].preferredDate, now);
  }

  private daysBetween(start: Date, end: Date): number {
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
  }

  private async hasRetentionRecommendationsTable(): Promise<boolean> {
    if (this.tableExists !== undefined) return this.tableExists;
    this.tableExists = await this.prisma.tableExists('retention_recommendations');
    if (!this.tableExists) {
      this.logger.warn('retention_recommendations table is missing; recommendations will be recomputed on every request until the CRM migration is applied');
    }
    return this.tableExists;
  }

  private async getLatestRecommendation(companyId: string, customerId: string): Promise<RetentionRecommendationRecord | null> {
    if (!(await this.hasRetentionRecommendationsTable())) return null;

    const rows = await this.prisma.$queryRawUnsafe<Array<{
      id: string;
      final_action: string;
      final_offer: unknown;
      final_priority: string;
      final_channel: string | null;
      reason: string;
      final_message: string | null;
      confidence: number | null;
      created_at: Date;
    }>>(
      `
        SELECT id, final_action, final_offer, final_priority, final_channel, reason, final_message, confidence, created_at
        FROM ${this.prisma.tableRef('retention_recommendations')}
        WHERE company_id = $1 AND customer_id = $2
        ORDER BY created_at DESC
        LIMIT 1
      `,
      companyId,
      customerId,
    );

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      action: row.final_action as RetentionAction,
      offer: row.final_offer as { type: string; discount: number },
      priority: row.final_priority as 'low' | 'medium' | 'high',
      channel: row.final_channel,
      reason: row.reason,
      message: row.final_message,
      confidence: row.confidence,
      createdAt: new Date(row.created_at),
    };
  }

  private async countPreviousRetentionAttempts(companyId: string, customerId: string): Promise<number> {
    if (!(await this.prisma.tableExists('followup_attempts'))) return 0;

    const rows = await this.prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `
        SELECT COUNT(*)::INT AS count
        FROM ${this.prisma.tableRef('followup_attempts')}
        WHERE company_id = $1 AND customer_id = $2 AND action = 'RETENTION'
      `,
      companyId,
      customerId,
    );

    return Number(rows[0]?.count ?? 0);
  }

  private async hasSameOfferRecently(companyId: string, customerId: string): Promise<boolean> {
    if (!(await this.hasRetentionRecommendationsTable())) return false;

    const rows = await this.prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `
        SELECT COUNT(*)::INT AS count
        FROM ${this.prisma.tableRef('retention_recommendations')}
        WHERE company_id = $1
          AND customer_id = $2
          AND final_action != 'no_action'
          AND created_at >= NOW() - INTERVAL '${SAME_OFFER_WINDOW_DAYS} days'
      `,
      companyId,
      customerId,
    );

    return Number(rows[0]?.count ?? 0) > 0;
  }

  private async persistRecommendation(
    companyId: string,
    customerId: string,
    audit: RetentionDecisionAudit,
    record: RetentionRecommendationRecord,
  ): Promise<string> {
    if (!(await this.hasRetentionRecommendationsTable())) {
      return 'uncommitted';
    }

    const rows = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `
        INSERT INTO ${this.prisma.tableRef('retention_recommendations')} (
          id, company_id, customer_id,
          rule_result, llm_recommendation, validation_result,
          final_action, final_offer, final_priority, final_channel, final_message,
          reason, confidence, status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2,
          CAST($3 AS JSONB), CAST($4 AS JSONB), CAST($5 AS JSONB),
          $6, CAST($7 AS JSONB), $8, $9, $10,
          $11, $12, 'generated', NOW(), NOW()
        )
        RETURNING id
      `,
      companyId,
      customerId,
      JSON.stringify(audit.ruleResult),
      audit.llmRecommendation ? JSON.stringify(audit.llmRecommendation) : null,
      JSON.stringify(audit.validation),
      record.action,
      JSON.stringify(record.offer),
      record.priority,
      record.channel,
      record.message,
      record.reason,
      record.confidence,
    );

    return rows[0]?.id ?? 'unknown';
  }
}
