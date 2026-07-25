import type { FollowupLlmRecommendation } from '@tscrm/types';
import { FollowupRuleEngine } from '../rules/followup-rule-engine';
import { FollowupContextBuilder } from '../context/followup-context-builder';
import { FollowupValidationService } from '../validation/followup-validation.service';
import { FollowupDecisionRequest, FollowupDecisionService } from './followup-decision.service';
import type { FollowupLlmClient } from '../../ai/followup-llm.client';

const baseRequest: FollowupDecisionRequest = {
  entityType: 'customer',
  entityId: 'cust-1',
  companyId: 'co-1',
  name: 'Jane Doe',
  automaticFollowupEnabled: true,
  previousFollowupAttempts: 0,
  recentFollowupExists: false,
  recipientPhone: '+15551234567',
  recentServiceHistory: [],
  averageMonthlySpend: 20,
};

function buildService(llmRecommend: jest.Mock) {
  const llmClient = { recommend: llmRecommend } as unknown as FollowupLlmClient;
  return new FollowupDecisionService(
    new FollowupRuleEngine(),
    new FollowupContextBuilder(),
    llmClient,
    new FollowupValidationService(),
  );
}

const llmRec: FollowupLlmRecommendation = {
  channel: 'SMS',
  priority: 'High',
  followupWithin: 'Today',
  reason: 'Customer has been inactive for a while',
  message: 'Hi Jane, time for your next HVAC service!',
  confidence: 0.8,
};

describe('FollowupDecisionService', () => {
  it('returns null when the rule engine finds no reason to follow up', async () => {
    const llmRecommend = jest.fn();
    const service = buildService(llmRecommend);

    const decision = await service.decide({ ...baseRequest, daysSinceLastService: 5 });

    expect(decision).toBeNull();
    expect(llmRecommend).not.toHaveBeenCalled(); // LLM must never be consulted when rules say no follow-up
  });

  it('returns a decision using the LLM recommendation when rules require follow-up', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(llmRec);
    const service = buildService(llmRecommend);

    const decision = await service.decide({ ...baseRequest, engagementStatus: 'INACTIVE' });

    expect(decision).not.toBeNull();
    expect(decision?.action).toBe('REENGAGEMENT');
    expect(decision?.finalChannel).toBe('SMS');
    expect(decision?.finalMessage).toBe(llmRec.message);
    expect(decision?.audit.ruleResult.reasonCode).toBe('CUSTOMER_INACTIVE');
    expect(decision?.audit.llmRecommendation).toEqual(llmRec);
    expect(decision?.audit.validation.passed).toBe(true);
  });

  it('falls back to rule-only decision when the LLM is unavailable', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(null);
    const service = buildService(llmRecommend);

    const decision = await service.decide({ ...baseRequest, engagementStatus: 'INACTIVE' });

    expect(decision).not.toBeNull();
    expect(decision?.finalChannel).toBe('SMS'); // derived from recipientPhone, not the LLM
    expect(decision?.finalMessage).toBeNull(); // caller falls back to canned copy
    expect(decision?.reason).toContain('INACTIVE');
  });

  it('returns null when validation blocks the follow-up even though rules matched', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(llmRec);
    const service = buildService(llmRecommend);

    const decision = await service.decide({
      ...baseRequest,
      engagementStatus: 'INACTIVE',
      previousFollowupAttempts: 6, // rule engine gate should already stop this, but confirm validation is a real second gate too
    });

    expect(decision).toBeNull();
  });

  it('returns null when the safety gate suppresses an otherwise-matching customer', async () => {
    const llmRecommend = jest.fn();
    const service = buildService(llmRecommend);

    const decision = await service.decide({
      ...baseRequest,
      engagementStatus: 'INACTIVE',
      automaticFollowupEnabled: false,
    });

    expect(decision).toBeNull();
    expect(llmRecommend).not.toHaveBeenCalled();
  });
});
