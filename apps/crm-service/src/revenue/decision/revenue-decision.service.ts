import { Injectable, Logger } from '@nestjs/common';
import type { RevenueCategory, RevenueChannel, RevenueDecisionAudit } from '@tscrm/types';
import { RevenueRuleEngine } from '../rules/revenue-rule-engine';
import { RevenueContextBuilder } from '../context/revenue-context-builder';
import { RevenueLlmClient } from '../../ai/revenue-llm.client';
import { RevenueValidationService } from '../validation/revenue-validation.service';

export interface RevenueDecisionRequest {
  customerId: string;
  companyId: string;
  name: string;
  customerSegment: 'premium' | 'standard' | 'budget';
  lifetimeSpend: number;
  equipment: Array<{ type: string; ageYears: number | null }>;
  agreementStatus?: string;
  agreementDaysUntilExpiry?: number | null;
  hasActiveAgreement: boolean;
  openQuotes: Array<{ id: string; daysSincePending: number; amount: number }>;
  overdueInvoices: Array<{ id: string; daysOverdue: number; amount: number }>;
  daysSinceLastService: number;
  automaticFollowupEnabled: boolean;
  previousRevenueAttempts: number;
  sameOfferRecentlySent: boolean;
  recipientPhone?: string;
  recipientEmail?: string;
  notes?: string;
}

export interface RevenueDecision {
  category: RevenueCategory;
  action: string | null;
  priority: 'low' | 'medium' | 'high';
  channel: RevenueChannel | null;
  reason: string;
  message: string | null;
  expectedRevenueImpact: number | null;
  llmConfidence: number | null;
  audit: RevenueDecisionAudit;
}

const PRIORITY_MAP: Record<'Low' | 'Medium' | 'High', 'low' | 'medium' | 'high'> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
};

/**
 * Orchestrates Rule Engine -> Context Builder -> LLM -> Validation, in that
 * fixed order: the rule engine alone decides WHETHER a revenue opportunity
 * exists and its category; the LLM only refines the strategy/action/impact
 * framing/channel/message; validation has the final say on what actually
 * gets surfaced. Always returns a decision (never null), because the CRM
 * dashboard's revenueRecommendation contract expects a populated object
 * even when the category is "no_opportunity". Mirrors
 * RetentionDecisionService/UpsellDecisionService.
 */
@Injectable()
export class RevenueDecisionService {
  private readonly logger = new Logger(RevenueDecisionService.name);

  constructor(
    private readonly ruleEngine: RevenueRuleEngine,
    private readonly contextBuilder: RevenueContextBuilder,
    private readonly llmClient: RevenueLlmClient,
    private readonly validationService: RevenueValidationService,
  ) {}

  async decide(request: RevenueDecisionRequest): Promise<RevenueDecision> {
    const hasContactChannel = Boolean(request.recipientPhone || request.recipientEmail);

    const ruleResult = this.ruleEngine.evaluate({
      customerId: request.customerId,
      companyId: request.companyId,
      openQuotes: request.openQuotes,
      overdueInvoices: request.overdueInvoices,
      agreementStatus: request.agreementStatus,
      agreementDaysUntilExpiry: request.agreementDaysUntilExpiry,
      hasActiveAgreement: request.hasActiveAgreement,
      daysSinceLastService: request.daysSinceLastService,
      oldestEquipmentAgeYears: this.oldestEquipmentAge(request.equipment),
      automaticFollowupEnabled: request.automaticFollowupEnabled,
      previousRevenueAttempts: request.previousRevenueAttempts,
      hasContactChannel,
    });

    if (!ruleResult.opportunityExists) {
      return this.noOpportunityDecision(
        ruleResult.reason ?? 'Customer does not meet revenue-opportunity targeting thresholds',
        { ruleResult, llmRecommendation: null, llmModel: null, validation: { passed: true, failedChecks: [] } },
      );
    }

    const profile = this.contextBuilder.build({
      name: request.name,
      ruleResult,
      customerSegment: request.customerSegment,
      lifetimeSpend: request.lifetimeSpend,
      equipment: request.equipment,
      agreementStatus: request.agreementStatus,
      openQuotes: request.openQuotes.map((quote) => ({ amount: quote.amount, daysSincePending: quote.daysSincePending })),
      overdueInvoices: request.overdueInvoices.map((invoice) => ({ amount: invoice.amount, daysOverdue: invoice.daysOverdue })),
      daysSinceLastService: request.daysSinceLastService,
      previousRevenueActions: request.previousRevenueAttempts,
      recipientPhone: request.recipientPhone,
      recipientEmail: request.recipientEmail,
      notes: request.notes,
    });

    const llmRecommendation = await this.llmClient.recommend(profile);

    const validation = this.validationService.validate(
      {
        ruleCategory: ruleResult.category,
        expectedRevenueImpact: ruleResult.expectedRevenueImpact,
        hasContactChannel,
        recipientPhone: request.recipientPhone,
        recipientEmail: request.recipientEmail,
        previousRevenueAttempts: request.previousRevenueAttempts,
        automaticFollowupEnabled: request.automaticFollowupEnabled,
        sameOfferRecentlySent: request.sameOfferRecentlySent,
      },
      llmRecommendation,
    );

    const audit: RevenueDecisionAudit = {
      ruleResult,
      llmRecommendation,
      llmModel: llmRecommendation ? (process.env.OPENAI_MODEL_REVENUE ?? 'gpt-4o-mini') : null,
      validation: { passed: validation.passed, failedChecks: validation.failedChecks },
      finalCategory: validation.finalCategory,
      finalChannel: validation.finalChannel,
      decidedAt: new Date().toISOString(),
    };

    if (!validation.passed) {
      this.logger.debug(
        `Revenue validation rejected LLM recommendation for customer ${request.customerId}: ${validation.failedChecks.join(', ')}`,
      );
    }

    return {
      category: validation.finalCategory,
      action: validation.finalAction,
      priority: this.resolvePriority(validation.finalCategory, ruleResult.highPriority, llmRecommendation),
      channel: validation.finalChannel,
      reason:
        validation.finalCategory === 'no_opportunity'
          ? (ruleResult.reason ?? 'Revenue recommendation did not pass validation')
          : (llmRecommendation?.reason ?? ruleResult.reason ?? 'Revenue opportunity identified'),
      message: validation.finalMessage,
      expectedRevenueImpact: validation.finalExpectedImpact,
      llmConfidence: llmRecommendation?.confidence ?? null,
      audit,
    };
  }

  private oldestEquipmentAge(equipment: Array<{ ageYears: number | null }>): number | undefined {
    const ages = equipment.map((item) => item.ageYears).filter((age): age is number => age != null);
    if (ages.length === 0) return undefined;
    return Math.max(...ages);
  }

  private resolvePriority(
    category: RevenueCategory,
    ruleHighPriority: boolean,
    llmRecommendation: { priority: 'Low' | 'Medium' | 'High' } | null,
  ): 'low' | 'medium' | 'high' {
    if (category === 'no_opportunity') return 'low';
    if (llmRecommendation) return PRIORITY_MAP[llmRecommendation.priority];
    return ruleHighPriority ? 'high' : 'medium';
  }

  private noOpportunityDecision(
    reason: string,
    audit: Omit<RevenueDecisionAudit, 'finalCategory' | 'finalChannel' | 'decidedAt'>,
  ): RevenueDecision {
    return {
      category: 'no_opportunity',
      action: null,
      priority: 'low',
      channel: null,
      reason,
      message: null,
      expectedRevenueImpact: null,
      llmConfidence: null,
      audit: {
        ...audit,
        finalCategory: 'no_opportunity',
        finalChannel: null,
        decidedAt: new Date().toISOString(),
      },
    };
  }
}
