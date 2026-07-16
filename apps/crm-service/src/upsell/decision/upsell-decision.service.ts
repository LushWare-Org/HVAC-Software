import { Injectable, Logger } from '@nestjs/common';
import type { UpsellCategory, UpsellChannel, UpsellCustomerSegment, UpsellDecisionAudit } from '@tscrm/types';
import { UpsellRuleEngine } from '../rules/upsell-rule-engine';
import { UpsellContextBuilder, type UpsellContextEquipmentInput } from '../context/upsell-context-builder';
import { UpsellLlmClient } from '../../ai/upsell-llm.client';
import { UpsellValidationService } from '../validation/upsell-validation.service';

export interface UpsellDecisionRequest {
  customerId: string;
  companyId: string;
  name: string;
  customerSegment: UpsellCustomerSegment;
  averageAnnualSpend: number;
  equipmentAgeYears: number;
  equipment: UpsellContextEquipmentInput[];
  hasNewEquipment: boolean;
  warrantyActive: boolean;
  agreementStatus?: string;
  repairCount12Months: number;
  daysSinceLastService: number;
  automaticFollowupEnabled: boolean;
  previousUpsellAttempts: number;
  sameOfferRecentlySent: boolean;
  recipientPhone?: string;
  recipientEmail?: string;
  recentQuotes?: string;
  notes?: string;
}

export interface UpsellDecision {
  category: UpsellCategory;
  offer: string | null;
  bundle: string | null;
  priority: 'low' | 'medium' | 'high';
  channel: UpsellChannel | null;
  reason: string;
  message: string | null;
  llmConfidence: number | null;
  audit: UpsellDecisionAudit;
}

const PRIORITY_MAP: Record<'Low' | 'Medium' | 'High', 'low' | 'medium' | 'high'> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
};

/**
 * Orchestrates Rule Engine -> Context Builder -> LLM -> Validation, in that
 * fixed order: the rule engine alone decides WHETHER an upsell opportunity
 * exists and its category; the LLM only refines the specific offer/bundle/
 * channel/message; validation has the final say on what actually gets
 * surfaced. Mirrors RetentionDecisionService (apps/crm-service/src/retention/decision/retention-decision.service.ts).
 * Always returns a decision — even "no_upsell" — because the CRM dashboard's
 * status-summary contract expects a populated object.
 */
@Injectable()
export class UpsellDecisionService {
  private readonly logger = new Logger(UpsellDecisionService.name);

  constructor(
    private readonly ruleEngine: UpsellRuleEngine,
    private readonly contextBuilder: UpsellContextBuilder,
    private readonly llmClient: UpsellLlmClient,
    private readonly validationService: UpsellValidationService,
  ) {}

  async decide(request: UpsellDecisionRequest): Promise<UpsellDecision> {
    const hasContactChannel = Boolean(request.recipientPhone || request.recipientEmail);

    const ruleResult = this.ruleEngine.evaluate({
      customerId: request.customerId,
      companyId: request.companyId,
      equipmentAgeYears: request.equipmentAgeYears,
      repairCount12Months: request.repairCount12Months,
      daysSinceLastService: request.daysSinceLastService,
      customerSegment: request.customerSegment,
      averageAnnualSpend: request.averageAnnualSpend,
      hasNewEquipment: request.hasNewEquipment,
      warrantyActive: request.warrantyActive,
      automaticFollowupEnabled: request.automaticFollowupEnabled,
      previousUpsellAttempts: request.previousUpsellAttempts,
      hasContactChannel,
    });

    if (!ruleResult.upsellRequired) {
      return this.noUpsellDecision(ruleResult.reason ?? 'Customer does not meet upsell targeting thresholds', {
        ruleResult,
        llmRecommendation: null,
        llmModel: null,
        validation: { passed: true, failedChecks: [] },
      });
    }

    const profile = this.contextBuilder.build({
      name: request.name,
      ruleResult,
      customerSegment: request.customerSegment,
      averageAnnualSpend: request.averageAnnualSpend,
      equipment: request.equipment,
      agreementStatus: request.agreementStatus,
      repairCount: request.repairCount12Months,
      daysSinceLastService: request.daysSinceLastService,
      previousUpsellAttempts: request.previousUpsellAttempts,
      recipientPhone: request.recipientPhone,
      recipientEmail: request.recipientEmail,
      recentQuotes: request.recentQuotes,
      notes: request.notes,
    });

    const llmRecommendation = await this.llmClient.recommend(profile);

    const validation = this.validationService.validate(
      {
        ruleCategory: ruleResult.category,
        hasContactChannel,
        recipientPhone: request.recipientPhone,
        recipientEmail: request.recipientEmail,
        previousUpsellAttempts: request.previousUpsellAttempts,
        automaticFollowupEnabled: request.automaticFollowupEnabled,
        sameOfferRecentlySent: request.sameOfferRecentlySent,
      },
      llmRecommendation,
    );

    const audit: UpsellDecisionAudit = {
      ruleResult,
      llmRecommendation,
      llmModel: llmRecommendation ? (process.env.OPENAI_MODEL_UPSELL ?? 'gpt-4o-mini') : null,
      validation: { passed: validation.passed, failedChecks: validation.failedChecks },
      finalCategory: validation.finalCategory,
      finalChannel: validation.finalChannel,
      decidedAt: new Date().toISOString(),
    };

    if (!validation.passed) {
      this.logger.debug(
        `Upsell validation rejected LLM recommendation for customer ${request.customerId}: ${validation.failedChecks.join(', ')}`,
      );
    }

    return {
      category: validation.finalCategory,
      offer: validation.finalOffer,
      bundle: validation.finalBundle,
      priority: this.resolvePriority(validation.finalCategory, ruleResult.highPriority, llmRecommendation),
      channel: validation.finalChannel,
      reason: validation.finalCategory === 'no_upsell'
        ? (ruleResult.reason ?? 'Upsell offer did not pass validation')
        : (llmRecommendation?.reason ?? ruleResult.reason ?? 'Upsell opportunity identified'),
      message: validation.finalMessage,
      llmConfidence: llmRecommendation?.confidence ?? null,
      audit,
    };
  }

  private resolvePriority(
    category: UpsellCategory,
    ruleHighPriority: boolean,
    llmRecommendation: { priority: 'Low' | 'Medium' | 'High' } | null,
  ): 'low' | 'medium' | 'high' {
    if (category === 'no_upsell') return 'low';
    if (llmRecommendation) return PRIORITY_MAP[llmRecommendation.priority];
    return ruleHighPriority ? 'high' : 'medium';
  }

  private noUpsellDecision(reason: string, audit: Omit<UpsellDecisionAudit, 'finalCategory' | 'finalChannel' | 'decidedAt'>): UpsellDecision {
    return {
      category: 'no_upsell',
      offer: null,
      bundle: null,
      priority: 'low',
      channel: null,
      reason,
      message: null,
      llmConfidence: null,
      audit: {
        ...audit,
        finalCategory: 'no_upsell',
        finalChannel: null,
        decidedAt: new Date().toISOString(),
      },
    };
  }
}
