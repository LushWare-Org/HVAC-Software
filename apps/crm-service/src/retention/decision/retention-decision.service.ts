import { Injectable, Logger } from '@nestjs/common';
import type { RetentionAction, RetentionChannel, RetentionDecisionAudit } from '@tscrm/types';
import { RetentionRuleEngine } from '../rules/retention-rule-engine';
import { RetentionContextBuilder } from '../context/retention-context-builder';
import { RetentionLlmClient } from '../../ai/retention-llm.client';
import { RetentionValidationService } from '../validation/retention-validation.service';

export interface RetentionDecisionRequest {
  customerId: string;
  companyId: string;
  name: string;
  customerSegment: 'premium' | 'standard' | 'budget';
  averageAnnualSpend: number;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  agreementStatus?: string;
  agreementEndDate?: string | null;
  daysSinceLastService: number;
  repairCount12Months: number;
  complaintCount: number;
  automaticFollowupEnabled: boolean;
  previousRetentionAttempts: number;
  sameOfferRecentlySent: boolean;
  recipientPhone?: string;
  recipientEmail?: string;
  equipmentAge?: number;
  activeContracts: number;
  notes?: string;
}

export interface RetentionDecision {
  action: RetentionAction;
  offer: { type: string; discount: number };
  priority: 'low' | 'medium' | 'high';
  channel: RetentionChannel | null;
  reason: string;
  message: string | null;
  llmConfidence: number | null;
  audit: RetentionDecisionAudit;
}

const PRIORITY_MAP: Record<'Low' | 'Medium' | 'High', 'low' | 'medium' | 'high'> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
};

/**
 * Orchestrates Rule Engine -> Context Builder -> LLM -> Validation, in that
 * fixed order: the rule engine alone decides WHETHER retention is required;
 * the LLM only refines the strategy/offer/channel/message; validation has
 * the final say on what actually gets surfaced. Mirrors FollowupDecisionService
 * (apps/crm-service/src/followup/decision/followup-decision.service.ts), but
 * — unlike follow-up, which returns null when no action is needed — this
 * always returns a decision, because the CRM dashboard's retentionPrediction
 * contract expects a populated object even when the action is "no_action".
 */
@Injectable()
export class RetentionDecisionService {
  private readonly logger = new Logger(RetentionDecisionService.name);

  constructor(
    private readonly ruleEngine: RetentionRuleEngine,
    private readonly contextBuilder: RetentionContextBuilder,
    private readonly llmClient: RetentionLlmClient,
    private readonly validationService: RetentionValidationService,
  ) {}

  async decide(request: RetentionDecisionRequest): Promise<RetentionDecision> {
    const hasContactChannel = Boolean(request.recipientPhone || request.recipientEmail);

    const ruleResult = this.ruleEngine.evaluate({
      customerId: request.customerId,
      companyId: request.companyId,
      customerSegment: request.customerSegment,
      agreementStatus: request.agreementStatus,
      agreementEndDate: request.agreementEndDate,
      daysSinceLastService: request.daysSinceLastService,
      repairCount12Months: request.repairCount12Months,
      complaintCount: request.complaintCount,
      averageAnnualSpend: request.averageAnnualSpend,
      engagementTrend: request.engagementTrend,
      automaticFollowupEnabled: request.automaticFollowupEnabled,
      previousRetentionAttempts: request.previousRetentionAttempts,
      hasContactChannel,
    });

    if (!ruleResult.retentionRequired) {
      return this.noActionDecision(ruleResult.reason ?? 'Customer does not meet retention targeting thresholds', {
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
      equipmentAge: request.equipmentAge,
      agreementStatus: request.agreementStatus,
      daysSinceLastService: request.daysSinceLastService,
      repairCount: request.repairCount12Months,
      complaintCount: request.complaintCount,
      previousRetentionAttempts: request.previousRetentionAttempts,
      activeContracts: request.activeContracts,
      recipientPhone: request.recipientPhone,
      recipientEmail: request.recipientEmail,
      notes: request.notes,
    });

    const llmRecommendation = await this.llmClient.recommend(profile);

    const validation = this.validationService.validate(
      {
        hasContactChannel,
        recipientPhone: request.recipientPhone,
        recipientEmail: request.recipientEmail,
        previousRetentionAttempts: request.previousRetentionAttempts,
        automaticFollowupEnabled: request.automaticFollowupEnabled,
        sameOfferRecentlySent: request.sameOfferRecentlySent,
      },
      llmRecommendation,
    );

    const audit: RetentionDecisionAudit = {
      ruleResult,
      llmRecommendation,
      llmModel: llmRecommendation ? (process.env.OPENAI_MODEL_RETENTION ?? 'gpt-4o-mini') : null,
      validation: { passed: validation.passed, failedChecks: validation.failedChecks },
      finalAction: validation.finalAction,
      finalChannel: validation.finalChannel,
      decidedAt: new Date().toISOString(),
    };

    if (!validation.passed) {
      this.logger.debug(
        `Retention validation rejected LLM recommendation for customer ${request.customerId}: ${validation.failedChecks.join(', ')}`,
      );
    }

    return {
      action: validation.finalAction,
      offer: validation.finalOffer,
      priority: this.resolvePriority(validation.finalAction, ruleResult.highPriority, llmRecommendation),
      channel: validation.finalChannel,
      reason: validation.finalAction === 'no_action'
        ? (ruleResult.reason ?? 'Retention offer did not pass validation')
        : (llmRecommendation?.reason ?? ruleResult.reason ?? 'Retention action required'),
      message: validation.finalMessage,
      llmConfidence: llmRecommendation?.confidence ?? null,
      audit,
    };
  }

  private resolvePriority(
    action: RetentionAction,
    ruleHighPriority: boolean,
    llmRecommendation: { priority: 'Low' | 'Medium' | 'High' } | null,
  ): 'low' | 'medium' | 'high' {
    if (action === 'no_action') return 'low';
    if (llmRecommendation) return PRIORITY_MAP[llmRecommendation.priority];
    return ruleHighPriority ? 'high' : 'medium';
  }

  private noActionDecision(reason: string, audit: Omit<RetentionDecisionAudit, 'finalAction' | 'finalChannel' | 'decidedAt'>): RetentionDecision {
    return {
      action: 'no_action',
      offer: { type: 'none', discount: 0 },
      priority: 'low',
      channel: null,
      reason,
      message: null,
      llmConfidence: null,
      audit: {
        ...audit,
        finalAction: 'no_action',
        finalChannel: null,
        decidedAt: new Date().toISOString(),
      },
    };
  }
}
