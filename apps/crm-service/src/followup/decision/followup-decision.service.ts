import { Injectable, Logger } from '@nestjs/common';
import type { FollowupAction, FollowupChannel, FollowupDecisionAudit } from '@tscrm/types';
import { FollowupRuleEngine } from '../rules/followup-rule-engine';
import { FollowupContextBuilder } from '../context/followup-context-builder';
import { FollowupLlmClient } from '../../ai/followup-llm.client';
import { FollowupValidationService } from '../validation/followup-validation.service';

export interface FollowupDecisionRequest {
  entityType: 'customer' | 'lead';
  entityId: string;
  companyId: string;
  name: string;
  automaticFollowupEnabled: boolean;
  previousFollowupAttempts: number;
  recentFollowupExists: boolean;
  recipientPhone?: string;
  recipientEmail?: string;
  leadStatus?: string;
  daysSinceLeadCreated?: number;
  quoteStatus?: string;
  quoteValue?: number;
  daysSinceQuoteSent?: number;
  daysSinceLastService?: number;
  engagementStatus?: string;
  agreementStatus?: string;
  agreementEndDate?: string | null;
  equipmentAge?: number;
  recentServiceHistory: string[];
  averageMonthlySpend: number;
  notes?: string;
}

export interface FollowupDecision {
  action: FollowupAction;
  reason: string;
  finalChannel: FollowupChannel;
  finalMessage: string | null;
  scheduledFor: string | null;
  llmConfidence: number | null;
  audit: FollowupDecisionAudit;
}

/**
 * Orchestrates Rule Engine -> Context Builder -> LLM -> Validation, in that
 * fixed order, matching the required design: the rule engine alone decides
 * WHETHER to follow up; the LLM only refines HOW; validation has the final
 * say on what actually gets queued.
 */
@Injectable()
export class FollowupDecisionService {
  private readonly logger = new Logger(FollowupDecisionService.name);

  constructor(
    private readonly ruleEngine: FollowupRuleEngine,
    private readonly contextBuilder: FollowupContextBuilder,
    private readonly llmClient: FollowupLlmClient,
    private readonly validationService: FollowupValidationService,
  ) {}

  async decide(request: FollowupDecisionRequest): Promise<FollowupDecision | null> {
    const hasContactChannel = Boolean(request.recipientPhone || request.recipientEmail);

    const ruleResult = this.ruleEngine.evaluate({
      entityType: request.entityType,
      entityId: request.entityId,
      companyId: request.companyId,
      leadStatus: request.leadStatus,
      daysSinceLeadCreated: request.daysSinceLeadCreated,
      quoteStatus: request.quoteStatus,
      quoteValue: request.quoteValue,
      daysSinceQuoteSent: request.daysSinceQuoteSent,
      daysSinceLastService: request.daysSinceLastService,
      engagementStatus: request.engagementStatus,
      agreementStatus: request.agreementStatus,
      agreementEndDate: request.agreementEndDate,
      previousFollowupAttempts: request.previousFollowupAttempts,
      automaticFollowupEnabled: request.automaticFollowupEnabled,
      hasContactChannel,
      recipientPhone: request.recipientPhone,
      recipientEmail: request.recipientEmail,
    });

    if (!ruleResult.needsFollowup) {
      return null;
    }

    const profile = this.contextBuilder.build({
      entityType: request.entityType,
      name: request.name,
      ruleResult,
      leadStatus: request.leadStatus,
      quoteStatus: request.quoteStatus,
      quoteValue: request.quoteValue,
      equipmentAge: request.equipmentAge,
      daysSinceLastService: request.daysSinceLastService,
      agreementStatus: request.agreementStatus,
      previousFollowupAttempts: request.previousFollowupAttempts,
      recipientPhone: request.recipientPhone,
      recipientEmail: request.recipientEmail,
      recentServiceHistory: request.recentServiceHistory,
      averageMonthlySpend: request.averageMonthlySpend,
      notes: request.notes,
    });

    const llmRecommendation = await this.llmClient.recommend(profile);

    const validation = this.validationService.validate(
      {
        hasContactChannel,
        recipientPhone: request.recipientPhone,
        recipientEmail: request.recipientEmail,
        previousFollowupAttempts: request.previousFollowupAttempts,
        automaticFollowupEnabled: request.automaticFollowupEnabled,
        recentFollowupExists: request.recentFollowupExists,
      },
      llmRecommendation,
    );

    const audit: FollowupDecisionAudit = {
      ruleResult,
      llmRecommendation,
      llmModel: llmRecommendation ? (process.env.GEMINI_MODEL_FOLLOWUP ?? 'gemini-2.5-flash') : null,
      validation: { passed: validation.passed, failedChecks: validation.failedChecks },
      finalAction: ruleResult.action as FollowupAction,
      finalChannel: validation.finalChannel,
      decidedAt: new Date().toISOString(),
    };

    if (!validation.passed || !validation.finalChannel) {
      this.logger.debug(
        `Validation blocked follow-up for ${request.entityType}:${request.entityId}: ${validation.failedChecks.join(', ')}`,
      );
      return null;
    }

    return {
      action: ruleResult.action as FollowupAction,
      reason: llmRecommendation?.reason ?? ruleResult.reason ?? 'Follow-up required',
      finalChannel: validation.finalChannel,
      finalMessage: validation.finalMessage,
      scheduledFor: validation.scheduledFor,
      llmConfidence: llmRecommendation?.confidence ?? null,
      audit,
    };
  }
}
