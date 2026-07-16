import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { UpsellCategory, UpsellCustomerSegment, UpsellDecisionAudit } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { FollowupProducer } from '../queues/followup.producer';
import { UpsellDecisionService, type UpsellDecision, type UpsellDecisionRequest } from './decision/upsell-decision.service';
import type { UpsellContextEquipmentInput } from './context/upsell-context-builder';

type TriggerSource = 'service_completion' | 'daily_batch' | 'profile_update' | 'manual';

const RECOMMENDATION_TTL_MS = 24 * 60 * 60 * 1000; // regenerate at most once per day per customer (status-summary reads)
const RECENT_RECOMMENDATION_WINDOW_DAYS = 7; // batch skip window: don't recompute an actionable offer more than once a week
const SAME_OFFER_WINDOW_DAYS = 30; // rule-engine safety gate: don't re-pitch within 30 days
const NEW_EQUIPMENT_WINDOW_DAYS = 365;
const PREMIUM_ANNUAL_SPEND = 2400;
const STANDARD_ANNUAL_SPEND = 600;
const HIGH_CONFIDENCE_FOLLOWUP_THRESHOLD = 0.7;

// Fallback numeric confidence used when the LLM is unavailable, so downstream
// numeric consumers (priority_score sort, CustomersService's retention score
// blend) keep working without a null. Deliberately conservative — this is a
// bridge value, not a calibrated probability.
const RULE_ONLY_CONFIDENCE: Record<'low' | 'medium' | 'high', number> = {
  high: 0.65,
  medium: 0.5,
  low: 0.2,
};

export interface UpsellRunSummary {
  processed: number;
  recommended: number;
  skipped: number;
  failures: number;
}

export interface UpsellRecommendationRecord {
  id: string;
  category: UpsellCategory;
  offer: string | null;
  bundle: string | null;
  priority: 'low' | 'medium' | 'high';
  priorityScore: number | null;
  channel: string | null;
  reason: string;
  message: string | null;
  confidence: number;
  status: string;
  triggerSource: string | null;
  createdAt: Date;
}

interface CustomerCandidate {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  notes: string | null;
  automaticFollowupEnabled: boolean;
  createdAt: Date;
  equipment: Array<{ type: string; installDate: Date | null; warrantyEnd: Date | null; createdAt: Date }>;
  bookings: Array<{ preferredDate: Date }>;
  agreements: Array<{ status: string; value: unknown }>;
}

/**
 * Generates upsell recommendations via the rule-based + LLM decision
 * pipeline (UpsellRuleEngine -> UpsellContextBuilder -> UpsellLlmClient ->
 * UpsellValidationService). Replaces the churn-service ML recommender
 * (`/recommend-offer`) — see docs/upsell-agent.md — while preserving the
 * existing scheduler, controller, database table, and Follow-up Agent
 * integration untouched. Mirrors RetentionAgent (apps/crm-service/src/agents/retention.agent.ts).
 */
@Injectable()
export class UpsellAgentService {
  private readonly logger = new Logger(UpsellAgentService.name);
  private recommendationsTableExists?: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly decisionService: UpsellDecisionService,
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

  /** Returns the cached recommendation if still fresh, otherwise regenerates and persists a new one. Used by CustomersService's status-summary endpoint. */
  async ensureRecommendation(companyId: string, customerId: string): Promise<UpsellRecommendationRecord | null> {
    const cached = await this.getLatestRecommendation(companyId, customerId);
    if (cached && Date.now() - cached.createdAt.getTime() < RECOMMENDATION_TTL_MS) {
      return cached;
    }

    const customer = await this.loadCustomer(companyId, customerId);
    if (!customer) {
      return cached;
    }

    return this.generateAndPersist(customer, 'profile_update');
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
          llm_offer AS "llmOffer",
          bundle,
          confidence,
          status,
          channel,
          reason,
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

    await this.generateAndPersist(customer, triggerSource);
    return 'recommended';
  }

  private async generateAndPersist(customer: CustomerCandidate, triggerSource: TriggerSource): Promise<UpsellRecommendationRecord> {
    const request = await this.buildDecisionRequest(customer);
    const decision = await this.decisionService.decide(request);

    const record = await this.persistRecommendation(customer, decision, triggerSource, request);

    if (this.shouldTriggerFollowUp(decision)) {
      await this.triggerFollowUp(customer, decision);
    }

    return record;
  }

  private shouldTriggerFollowUp(decision: UpsellDecision): boolean {
    if (decision.category === 'no_upsell') return false;
    if (decision.priority === 'high') return true;
    return (decision.llmConfidence ?? 0) >= HIGH_CONFIDENCE_FOLLOWUP_THRESHOLD;
  }

  private async buildDecisionRequest(customer: CustomerCandidate): Promise<UpsellDecisionRequest> {
    const now = new Date();
    const daysSinceLastService = this.computeDaysSinceLastService(customer.bookings, customer.createdAt, now);
    const repairCount12Months = customer.bookings.filter(
      (booking) => this.daysBetween(booking.preferredDate, now) <= 365,
    ).length;
    const averageAnnualSpend = this.computeAverageAnnualSpend(customer.agreements);
    const latestAgreement = customer.agreements[0];
    const recipientPhone = customer.mobile ?? customer.phone;
    const recipientEmail = customer.email;

    const oldestEquipment = this.findOldestEquipment(customer.equipment);
    const newestEquipment = this.findNewestEquipment(customer.equipment);
    const equipmentAgeYears = oldestEquipment ? this.ageInYears(oldestEquipment.installDate ?? oldestEquipment.createdAt, now) : 0;
    const hasNewEquipment = newestEquipment
      ? this.daysBetween(newestEquipment.installDate ?? newestEquipment.createdAt, now) <= NEW_EQUIPMENT_WINDOW_DAYS
      : false;
    const warrantyActive = Boolean(newestEquipment?.warrantyEnd && newestEquipment.warrantyEnd.getTime() > now.getTime());

    const previousUpsellAttempts = await this.countPreviousUpsellAttempts(customer.companyId, customer.id);
    const sameOfferRecentlySent = await this.hasSameOfferRecently(customer.companyId, customer.id);

    return {
      customerId: customer.id,
      companyId: customer.companyId,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      customerSegment: this.deriveSegment(averageAnnualSpend),
      averageAnnualSpend,
      equipmentAgeYears: Number(equipmentAgeYears.toFixed(1)),
      equipment: this.buildEquipmentProfile(customer.equipment, now),
      hasNewEquipment,
      warrantyActive,
      agreementStatus: latestAgreement?.status,
      repairCount12Months,
      daysSinceLastService,
      automaticFollowupEnabled: customer.automaticFollowupEnabled,
      previousUpsellAttempts,
      sameOfferRecentlySent,
      recipientPhone: recipientPhone ?? undefined,
      recipientEmail: recipientEmail ?? undefined,
      notes: customer.notes ?? undefined,
    };
  }

  private buildEquipmentProfile(
    equipment: Array<{ type: string; installDate: Date | null; warrantyEnd: Date | null; createdAt: Date }>,
    now: Date,
  ): UpsellContextEquipmentInput[] {
    return equipment.map((item) => ({
      type: item.type,
      ageYears: item.installDate ? Number(this.ageInYears(item.installDate, now).toFixed(1)) : null,
      warrantyStatus: !item.warrantyEnd ? 'unknown' : item.warrantyEnd.getTime() > now.getTime() ? 'active' : 'expired',
    }));
  }

  private deriveSegment(averageAnnualSpend: number): UpsellCustomerSegment {
    if (averageAnnualSpend >= PREMIUM_ANNUAL_SPEND) return 'premium';
    if (averageAnnualSpend >= STANDARD_ANNUAL_SPEND) return 'standard';
    return 'budget';
  }

  private computeAverageAnnualSpend(agreements: Array<{ status: string; value: unknown }>): number {
    const annualValue = agreements
      .filter((agreement) => agreement.status === 'ACTIVE')
      .reduce((sum, agreement) => sum + Number(agreement.value ?? 0), 0);
    return Number(annualValue.toFixed(2));
  }

  private findOldestEquipment<T extends { installDate: Date | null; createdAt: Date }>(equipment: T[]): T | undefined {
    if (equipment.length === 0) return undefined;
    return [...equipment].sort((a, b) => (a.installDate ?? a.createdAt).getTime() - (b.installDate ?? b.createdAt).getTime())[0];
  }

  private findNewestEquipment<T extends { installDate: Date | null; createdAt: Date }>(equipment: T[]): T | undefined {
    if (equipment.length === 0) return undefined;
    return [...equipment].sort((a, b) => (b.installDate ?? b.createdAt).getTime() - (a.installDate ?? a.createdAt).getTime())[0];
  }

  private ageInYears(date: Date, now: Date): number {
    return this.daysBetween(date, now) / 365;
  }

  private async persistRecommendation(
    customer: CustomerCandidate,
    decision: UpsellDecision,
    triggerSource: TriggerSource,
    request: UpsellDecisionRequest,
  ): Promise<UpsellRecommendationRecord> {
    const status = decision.category === 'no_upsell' ? 'no_upsell' : 'pending';
    const confidence = decision.llmConfidence ?? RULE_ONLY_CONFIDENCE[decision.priority];
    const priorityBaseline = { high: 0.85, medium: 0.55, low: 0.25 }[decision.priority];
    const priorityScore = decision.llmConfidence ?? priorityBaseline;

    const record: UpsellRecommendationRecord = {
      id: randomUUID(),
      category: decision.category,
      offer: decision.offer,
      bundle: decision.bundle,
      priority: decision.priority,
      priorityScore,
      channel: decision.channel,
      reason: decision.reason,
      message: decision.message,
      confidence,
      status,
      triggerSource,
      createdAt: new Date(),
    };

    if (!(await this.hasRecommendationsTable())) {
      this.logger.warn('upsell_recommendations table is missing; recommendation was generated but not persisted');
      return record;
    }

    await this.prisma.$executeRawUnsafe(
      `
        INSERT INTO ${this.prisma.tableRef('upsell_recommendations')} (
          id, company_id, customer_id,
          recommended_offer, confidence, status,
          rule_offer, model_offer, trigger_source, priority_score, input_payload,
          rule_result, llm_recommendation, validation_result,
          llm_offer, bundle, channel, message, reason_code, reason,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3,
          $4, $5, $6,
          $7, $8, $9, $10, CAST($11 AS JSONB),
          CAST($12 AS JSONB), CAST($13 AS JSONB), CAST($14 AS JSONB),
          $15, $16, $17, $18, $19, $20,
          NOW(), NOW()
        )
      `,
      record.id,
      customer.companyId,
      customer.id,
      decision.category,
      confidence,
      status,
      decision.audit.ruleResult.matchedRule,
      decision.audit.llmRecommendation ? 'llm' : 'rule_engine',
      triggerSource,
      priorityScore,
      JSON.stringify(request),
      JSON.stringify(decision.audit.ruleResult),
      decision.audit.llmRecommendation ? JSON.stringify(decision.audit.llmRecommendation) : null,
      JSON.stringify(decision.audit.validation),
      decision.offer,
      decision.bundle,
      decision.channel,
      decision.message,
      decision.audit.ruleResult.reasonCode,
      decision.reason,
    );

    return record;
  }

  private async triggerFollowUp(customer: CustomerCandidate, decision: UpsellDecision): Promise<void> {
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
      reason: `Recommended ${decision.category}${decision.offer ? ` (${decision.offer})` : ''}: ${decision.reason}`,
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
        select: { type: true, installDate: true, warrantyEnd: true, createdAt: true },
      },
      bookings: {
        where: { status: { in: ['CONFIRMED' as const, 'CONVERTED' as const] } },
        orderBy: { preferredDate: 'desc' as const },
        take: 24,
        select: { preferredDate: true },
      },
      agreements: {
        select: { status: true, value: true },
      },
    };
  }

  private async hasRecommendationsTable(): Promise<boolean> {
    if (this.recommendationsTableExists) {
      return true;
    }

    const tableExists = await this.prisma.tableExists('upsell_recommendations');
    if (!tableExists) {
      this.logger.warn('upsell_recommendations table is missing; run CRM migrations to persist upsell recommendations');
      return false;
    }

    this.recommendationsTableExists = true;
    return true;
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
          AND created_at >= NOW() - INTERVAL '${RECENT_RECOMMENDATION_WINDOW_DAYS} days'
      `,
      companyId,
      customerId,
    );

    return Number(rows[0]?.count ?? 0) > 0;
  }

  private async countPreviousUpsellAttempts(companyId: string, customerId: string): Promise<number> {
    if (!(await this.prisma.tableExists('followup_attempts'))) return 0;

    const rows = await this.prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `
        SELECT COUNT(*)::INT AS count
        FROM ${this.prisma.tableRef('followup_attempts')}
        WHERE company_id = $1 AND customer_id = $2 AND action = 'UPSELL'
      `,
      companyId,
      customerId,
    );

    return Number(rows[0]?.count ?? 0);
  }

  private async hasSameOfferRecently(companyId: string, customerId: string): Promise<boolean> {
    if (!(await this.hasRecommendationsTable())) return false;

    const rows = await this.prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `
        SELECT COUNT(*)::INT AS count
        FROM ${this.prisma.tableRef('upsell_recommendations')}
        WHERE company_id = $1
          AND customer_id = $2
          AND status = 'pending'
          AND created_at >= NOW() - INTERVAL '${SAME_OFFER_WINDOW_DAYS} days'
      `,
      companyId,
      customerId,
    );

    return Number(rows[0]?.count ?? 0) > 0;
  }

  private async getLatestRecommendation(companyId: string, customerId: string): Promise<UpsellRecommendationRecord | null> {
    if (!(await this.hasRecommendationsTable())) return null;

    const rows = await this.prisma.$queryRawUnsafe<Array<{
      id: string;
      recommended_offer: string;
      llm_offer: string | null;
      bundle: string | null;
      priority_score: number | null;
      channel: string | null;
      reason: string | null;
      message: string | null;
      confidence: number;
      status: string;
      trigger_source: string | null;
      created_at: Date;
    }>>(
      `
        SELECT id, recommended_offer, llm_offer, bundle, priority_score, channel, reason, message, confidence, status, trigger_source, created_at
        FROM ${this.prisma.tableRef('upsell_recommendations')}
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
      category: row.recommended_offer as UpsellCategory,
      offer: row.llm_offer,
      bundle: row.bundle,
      priority: this.priorityFromScore(row.priority_score),
      priorityScore: row.priority_score === null ? null : Number(row.priority_score),
      channel: row.channel,
      reason: row.reason ?? '',
      message: row.message,
      confidence: Number(row.confidence),
      status: row.status,
      triggerSource: row.trigger_source,
      createdAt: new Date(row.created_at),
    };
  }

  private priorityFromScore(score: number | null): 'low' | 'medium' | 'high' {
    if (score === null) return 'low';
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  private computeDaysSinceLastService(bookings: Array<{ preferredDate: Date }>, fallbackDate: Date, now: Date): number {
    return this.daysBetween(bookings[0]?.preferredDate ?? fallbackDate, now);
  }

  private daysBetween(start: Date, end: Date): number {
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
  }
}
