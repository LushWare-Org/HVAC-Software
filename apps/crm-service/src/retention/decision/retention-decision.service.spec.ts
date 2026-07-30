import type { RetentionLlmRecommendation } from '@tscrm/types';
import { RetentionRuleEngine } from '../rules/retention-rule-engine';
import { RetentionContextBuilder } from '../context/retention-context-builder';
import { RetentionValidationService } from '../validation/retention-validation.service';
import { RetentionDecisionRequest, RetentionDecisionService } from './retention-decision.service';
import type { RetentionLlmClient } from '../../ai/retention-llm.client';

const baseRequest: RetentionDecisionRequest = {
  customerId: 'cust-1',
  companyId: 'co-1',
  name: 'Jane Doe',
  customerSegment: 'standard',
  averageAnnualSpend: 1200,
  engagementTrend: 'stable',
  daysSinceLastService: 10,
  repairCount12Months: 0,
  complaintCount: 0,
  automaticFollowupEnabled: true,
  previousRetentionAttempts: 0,
  sameOfferRecentlySent: false,
  recipientPhone: '+15551234567',
  activeContracts: 1,
};

function buildService(llmRecommend: jest.Mock) {
  const llmClient = { recommend: llmRecommend } as unknown as RetentionLlmClient;
  return new RetentionDecisionService(
    new RetentionRuleEngine(),
    new RetentionContextBuilder(),
    llmClient,
    new RetentionValidationService(),
  );
}

const llmRec: RetentionLlmRecommendation = {
  strategy: 'Maintenance plan enrollment',
  action: 'maintenance_plan_offer',
  priority: 'High',
  channel: 'whatsapp',
  reason: 'Customer has had frequent repairs this year',
  message: 'We would like to offer a maintenance plan to help reduce future repair costs.',
  confidence: 0.88,
};

describe('RetentionDecisionService', () => {
  it('returns a no_action decision without calling the LLM when rules find no reason to retain', async () => {
    const llmRecommend = jest.fn();
    const service = buildService(llmRecommend);

    const decision = await service.decide(baseRequest);

    expect(decision.action).toBe('no_action');
    expect(decision.channel).toBeNull();
    expect(llmRecommend).not.toHaveBeenCalled(); // LLM must never be consulted when rules say no retention is needed
  });

  it('returns a decision using the LLM recommendation when rules require retention', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(llmRec);
    const service = buildService(llmRecommend);

    const decision = await service.decide({ ...baseRequest, repairCount12Months: 3 });

    expect(decision.action).toBe('maintenance_plan_offer');
    expect(decision.channel).toBe('whatsapp');
    expect(decision.message).toBe(llmRec.message);
    expect(decision.priority).toBe('high');
    expect(decision.audit.ruleResult.reasonCode).toBe('FREQUENT_REPAIRS');
    expect(decision.audit.llmRecommendation).toEqual(llmRec);
    expect(decision.audit.validation.passed).toBe(true);
  });

  it('falls back to the rule-decided action (medium priority, no message) when the LLM is unavailable', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(null);
    const service = buildService(llmRecommend);

    const decision = await service.decide({ ...baseRequest, repairCount12Months: 3 });

    expect(decision.action).toBe('maintenance_plan_offer'); // FREQUENT_REPAIRS -> maintenance_plan_offer fallback
    expect(decision.channel).toBe('whatsapp'); // derived from recipientPhone, not the LLM
    expect(decision.message).toBeNull(); // customer-facing copy still requires an LLM sign-off
    expect(decision.priority).toBe('medium'); // ruleHighPriority is false for FREQUENT_REPAIRS
    expect(decision.audit.ruleResult.reasonCode).toBe('FREQUENT_REPAIRS');
  });

  it('forces no_action when validation blocks the recommendation even though rules matched', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(llmRec);
    const service = buildService(llmRecommend);

    const decision = await service.decide({
      ...baseRequest,
      repairCount12Months: 3,
      sameOfferRecentlySent: true,
    });

    expect(decision.action).toBe('no_action');
    expect(decision.audit.validation.passed).toBe(false);
    expect(decision.audit.validation.failedChecks).toContain('DUPLICATE_OFFER');
  });

  it('returns no_action without calling the LLM when the safety gate suppresses an otherwise-matching customer', async () => {
    const llmRecommend = jest.fn();
    const service = buildService(llmRecommend);

    const decision = await service.decide({
      ...baseRequest,
      repairCount12Months: 3,
      automaticFollowupEnabled: false,
    });

    expect(decision.action).toBe('no_action');
    expect(llmRecommend).not.toHaveBeenCalled();
  });

  it('flags high priority for the customer complaints rule', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(null);
    const service = buildService(llmRecommend);

    const decision = await service.decide({ ...baseRequest, complaintCount: 2 });

    expect(decision.audit.ruleResult.reasonCode).toBe('CUSTOMER_COMPLAINTS');
    expect(decision.audit.ruleResult.highPriority).toBe(true);
  });
});
