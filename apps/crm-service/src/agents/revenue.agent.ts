import { Injectable, Logger } from '@nestjs/common';
import type { RevenueCategory, RevenueDecisionAudit } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { RevenueDecisionService, type RevenueDecisionRequest } from '../revenue/decision/revenue-decision.service';

const RECOMMENDATION_TTL_MS = 24 * 60 * 60 * 1000; // regenerate at most once per day per customer
const SAME_OFFER_WINDOW_DAYS = 30;
const PREMIUM_ANNUAL_SPEND = 2400;
const STANDARD_ANNUAL_SPEND = 600;

export interface RevenueRecommendationRecord {
  id: string;
  category: RevenueCategory;
  action: string | null;
  priority: 'low' | 'medium' | 'high';
  channel: string | null;
  reason: string;
  message: string | null;
  expectedRevenueImpact: number | null;
  confidence: number | null;
  createdAt: Date;
}

interface CustomerRevenueCandidate {
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
  equipment: Array<{ type: string; installDate: Date | null }>;
}

interface FinanceQuoteRow {
  id: string;
  created_at: Date;
  total: unknown;
}

interface FinanceInvoiceRow {
  id: string;
  due_date: Date;
  balance_due: unknown;
}

/**
 * Generates and caches revenue-opportunity recommendations via the
 * rule-based + LLM decision pipeline (RevenueRuleEngine -> RevenueContextBuilder
 * -> RevenueLlmClient -> RevenueValidationService). Recommendations are
 * persisted to revenue_recommendations so:
 *   1. The dashboard reads a cached decision instead of paying LLM latency
 *      on every status-summary request (mirrors the retention_recommendations
 *      cache-aside pattern already used by CustomersService).
 *   2. Every decision is a feedback-log row that can later train an ML
 *      replacement for the rule engine.
 * Mirrors apps/crm-service/src/agents/retention.agent.ts.
 */
@Injectable()
export class RevenueAgent {
  private readonly logger = new Logger(RevenueAgent.name);
  private tableExists?: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly decisionService: RevenueDecisionService,
  ) {}

  /** Returns the cached recommendation if still fresh, otherwise regenerates and persists a new one. */
  async ensureRecommendation(companyId: string, customerId: string): Promise<RevenueRecommendationRecord | null> {
    const cached = await this.getLatestRecommendation(companyId, customerId);
    if (cached && Date.now() - cached.createdAt.getTime() < RECOMMENDATION_TTL_MS) {
      return cached;
    }

    return this.generateRecommendation(companyId, customerId);
  }

  async generateRecommendation(companyId: string, customerId: string): Promise<RevenueRecommendationRecord | null> {
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
        equipment: { orderBy: [{ installDate: 'asc' }, { createdAt: 'asc' }], select: { type: true, installDate: true } },
      },
    });

    if (!customer) {
      return null;
    }

    const [openQuotes, overdueInvoices] = await Promise.all([
      this.fetchOpenQuotes(companyId, customerId),
      this.fetchOverdueInvoices(companyId, customerId),
    ]);

    const request = await this.buildDecisionRequest(customer as CustomerRevenueCandidate, openQuotes, overdueInvoices);
    const decision = await this.decisionService.decide(request);

    const record: RevenueRecommendationRecord = {
      id: '',
      category: decision.category,
      action: decision.action,
      priority: decision.priority,
      channel: decision.channel,
      reason: decision.reason,
      message: decision.message,
      expectedRevenueImpact: decision.expectedRevenueImpact,
      confidence: decision.llmConfidence,
      createdAt: new Date(),
    };

    record.id = await this.persistRecommendation(companyId, customerId, decision.audit, record);
    return record;
  }

  private async buildDecisionRequest(
    customer: CustomerRevenueCandidate,
    openQuotes: Array<{ id: string; daysSincePending: number; amount: number }>,
    overdueInvoices: Array<{ id: string; daysOverdue: number; amount: number }>,
  ): Promise<RevenueDecisionRequest> {
    const now = new Date();
    const daysSinceLastService = this.computeDaysSinceLastService(customer.bookings, now);
    const lifetimeSpend = this.computeLifetimeSpend(customer.agreements);
    const latestAgreement = customer.agreements[0];
    const hasActiveAgreement = customer.agreements.some((agreement) => agreement.status === 'ACTIVE');
    const equipment = customer.equipment.map((item) => ({
      type: item.type,
      ageYears: item.installDate ? Number(this.ageInYears(item.installDate, now).toFixed(1)) : null,
    }));
    const recipientPhone = customer.mobile ?? customer.phone;
    const recipientEmail = customer.email;

    const previousRevenueAttempts = await this.countPreviousRevenueAttempts(customer.companyId, customer.id);
    const sameOfferRecentlySent = await this.hasSameOfferRecently(customer.companyId, customer.id);

    return {
      customerId: customer.id,
      companyId: customer.companyId,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      customerSegment: this.deriveSegment(lifetimeSpend),
      lifetimeSpend,
      equipment,
      agreementStatus: latestAgreement?.status,
      agreementDaysUntilExpiry: latestAgreement?.endDate ? this.daysBetween(now, latestAgreement.endDate) : null,
      hasActiveAgreement,
      openQuotes,
      overdueInvoices,
      daysSinceLastService,
      automaticFollowupEnabled: customer.automaticFollowupEnabled,
      previousRevenueAttempts,
      sameOfferRecentlySent,
      recipientPhone: recipientPhone ?? undefined,
      recipientEmail: recipientEmail ?? undefined,
      notes: customer.notes ?? undefined,
    };
  }

  private async fetchOpenQuotes(
    companyId: string,
    customerId: string,
  ): Promise<Array<{ id: string; daysSincePending: number; amount: number }>> {
    const rows = await this.prisma.$queryRawUnsafe<FinanceQuoteRow[]>(
      `
        SELECT id, "createdAt" AS created_at, total
        FROM finance."Quote"
        WHERE "companyId" = $1 AND "customerId" = $2 AND status IN ('SENT', 'VIEWED')
        ORDER BY "createdAt" ASC
      `,
      companyId,
      customerId,
    );

    const now = new Date();
    return rows.map((row) => ({
      id: row.id,
      daysSincePending: this.daysBetween(row.created_at, now),
      amount: Number(row.total ?? 0),
    }));
  }

  private async fetchOverdueInvoices(
    companyId: string,
    customerId: string,
  ): Promise<Array<{ id: string; daysOverdue: number; amount: number }>> {
    const rows = await this.prisma.$queryRawUnsafe<FinanceInvoiceRow[]>(
      `
        SELECT id, "dueDate" AS due_date, "balanceDue" AS balance_due
        FROM finance."Invoice"
        WHERE "companyId" = $1 AND "customerId" = $2
          AND status NOT IN ('PAID', 'VOID')
          AND "dueDate" IS NOT NULL AND "dueDate" < NOW()
        ORDER BY "dueDate" ASC
      `,
      companyId,
      customerId,
    );

    const now = new Date();
    return rows.map((row) => ({
      id: row.id,
      daysOverdue: this.daysBetween(row.due_date, now),
      amount: Number(row.balance_due ?? 0),
    }));
  }

  private deriveSegment(lifetimeSpend: number): 'premium' | 'standard' | 'budget' {
    if (lifetimeSpend >= PREMIUM_ANNUAL_SPEND) return 'premium';
    if (lifetimeSpend >= STANDARD_ANNUAL_SPEND) return 'standard';
    return 'budget';
  }

  private computeLifetimeSpend(agreements: Array<{ status: string; value: unknown }>): number {
    const total = agreements
      .filter((agreement) => agreement.status === 'ACTIVE')
      .reduce((sum, agreement) => sum + Number(agreement.value ?? 0), 0);
    return Number(total.toFixed(2));
  }

  private ageInYears(date: Date, now: Date): number {
    return this.daysBetween(date, now) / 365;
  }

  private computeDaysSinceLastService(bookings: Array<{ preferredDate: Date }>, now: Date): number {
    if (bookings.length === 0) return 9999;
    return this.daysBetween(bookings[0].preferredDate, now);
  }

  private daysBetween(start: Date, end: Date): number {
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
  }

  private async hasRevenueRecommendationsTable(): Promise<boolean> {
    if (this.tableExists !== undefined) return this.tableExists;
    this.tableExists = await this.prisma.tableExists('revenue_recommendations');
    if (!this.tableExists) {
      this.logger.warn('revenue_recommendations table is missing; recommendations will be recomputed on every request until the CRM migration is applied');
    }
    return this.tableExists;
  }

  private async getLatestRecommendation(companyId: string, customerId: string): Promise<RevenueRecommendationRecord | null> {
    if (!(await this.hasRevenueRecommendationsTable())) return null;

    const rows = await this.prisma.$queryRawUnsafe<Array<{
      id: string;
      final_category: string;
      final_action: string | null;
      final_priority: string;
      final_channel: string | null;
      reason: string;
      final_message: string | null;
      expected_revenue_impact: unknown;
      confidence: number | null;
      created_at: Date;
    }>>(
      `
        SELECT id, final_category, final_action, final_priority, final_channel, reason,
               final_message, expected_revenue_impact, confidence, created_at
        FROM ${this.prisma.tableRef('revenue_recommendations')}
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
      category: row.final_category as RevenueCategory,
      action: row.final_action,
      priority: row.final_priority as 'low' | 'medium' | 'high',
      channel: row.final_channel,
      reason: row.reason,
      message: row.final_message,
      expectedRevenueImpact: row.expected_revenue_impact != null ? Number(row.expected_revenue_impact) : null,
      confidence: row.confidence,
      createdAt: new Date(row.created_at),
    };
  }

  private async countPreviousRevenueAttempts(companyId: string, customerId: string): Promise<number> {
    if (!(await this.hasRevenueRecommendationsTable())) return 0;

    const rows = await this.prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `
        SELECT COUNT(*)::INT AS count
        FROM ${this.prisma.tableRef('revenue_recommendations')}
        WHERE company_id = $1 AND customer_id = $2 AND final_category != 'no_opportunity'
      `,
      companyId,
      customerId,
    );

    return Number(rows[0]?.count ?? 0);
  }

  private async hasSameOfferRecently(companyId: string, customerId: string): Promise<boolean> {
    if (!(await this.hasRevenueRecommendationsTable())) return false;

    const rows = await this.prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `
        SELECT COUNT(*)::INT AS count
        FROM ${this.prisma.tableRef('revenue_recommendations')}
        WHERE company_id = $1
          AND customer_id = $2
          AND final_category != 'no_opportunity'
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
    audit: RevenueDecisionAudit,
    record: RevenueRecommendationRecord,
  ): Promise<string> {
    if (!(await this.hasRevenueRecommendationsTable())) {
      return 'uncommitted';
    }

    const rows = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `
        INSERT INTO ${this.prisma.tableRef('revenue_recommendations')} (
          id, company_id, customer_id,
          rule_result, llm_recommendation, validation_result,
          final_category, final_action, final_priority, final_channel, final_message,
          reason, expected_revenue_impact, confidence, status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2,
          CAST($3 AS JSONB), CAST($4 AS JSONB), CAST($5 AS JSONB),
          $6, $7, $8, $9, $10,
          $11, $12, $13, 'generated', NOW(), NOW()
        )
        RETURNING id
      `,
      companyId,
      customerId,
      JSON.stringify(audit.ruleResult),
      audit.llmRecommendation ? JSON.stringify(audit.llmRecommendation) : null,
      JSON.stringify(audit.validation),
      record.category,
      record.action,
      record.priority,
      record.channel,
      record.message,
      record.reason,
      record.expectedRevenueImpact,
      record.confidence,
    );

    return rows[0]?.id ?? 'unknown';
  }
}
