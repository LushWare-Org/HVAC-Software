import type { UpsellLlmRecommendation } from '@tscrm/types';
import { UpsellRuleEngine } from '../rules/upsell-rule-engine';
import { UpsellContextBuilder } from '../context/upsell-context-builder';
import { UpsellValidationService } from '../validation/upsell-validation.service';
import { UpsellDecisionRequest, UpsellDecisionService } from './upsell-decision.service';
import type { UpsellLlmClient } from '../../ai/upsell-llm.client';

const baseRequest: UpsellDecisionRequest = {
  customerId: 'cust-1',
  companyId: 'co-1',
  name: 'Jane Doe',
  customerSegment: 'standard',
  averageAnnualSpend: 1200,
  equipmentAgeYears: 2,
  equipment: [{ type: 'AC Unit', ageYears: 2, warrantyStatus: 'expired' }],
  hasNewEquipment: false,
  warrantyActive: false,
  repairCount12Months: 0,
  daysSinceLastService: 10,
  automaticFollowupEnabled: true,
  previousUpsellAttempts: 0,
  sameOfferRecentlySent: false,
  recipientPhone: '+15551234567',
};

function buildService(llmRecommend: jest.Mock) {
  const llmClient = { recommend: llmRecommend } as unknown as UpsellLlmClient;
  return new UpsellDecisionService(
    new UpsellRuleEngine(),
    new UpsellContextBuilder(),
    llmClient,
    new UpsellValidationService(),
  );
}

const llmRec: UpsellLlmRecommendation = {
  offer: 'Premium Maintenance Plan',
  bundle: 'Annual Maintenance + Priority Support',
  priority: 'High',
  channel: 'whatsapp',
  reason: 'Customer has had frequent repairs this year',
  message: 'We noticed your system has required several repairs recently. Our maintenance plan can help.',
  confidence: 0.88,
};

describe('UpsellDecisionService', () => {
  it('returns a no_upsell decision without calling the LLM when rules find no opportunity', async () => {
    const llmRecommend = jest.fn();
    const service = buildService(llmRecommend);

    const decision = await service.decide(baseRequest);

    expect(decision.category).toBe('no_upsell');
    expect(decision.channel).toBeNull();
    expect(llmRecommend).not.toHaveBeenCalled(); // LLM must never be consulted when rules say no upsell is needed
  });

  it('returns a decision using the LLM recommendation when rules find an opportunity', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(llmRec);
    const service = buildService(llmRecommend);

    const decision = await service.decide({ ...baseRequest, repairCount12Months: 3 });

    expect(decision.category).toBe('maintenance_plan');
    expect(decision.offer).toBe(llmRec.offer);
    expect(decision.bundle).toBe(llmRec.bundle);
    expect(decision.channel).toBe('whatsapp');
    expect(decision.message).toBe(llmRec.message);
    expect(decision.priority).toBe('high');
    expect(decision.audit.ruleResult.reasonCode).toBe('FREQUENT_REPAIRS');
    expect(decision.audit.llmRecommendation).toEqual(llmRec);
    expect(decision.audit.validation.passed).toBe(true);
  });

  it('falls back to the rule-decided category (still no offer copy) when the LLM is unavailable', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(null);
    const service = buildService(llmRecommend);

    const decision = await service.decide({ ...baseRequest, repairCount12Months: 3 });

    expect(decision.category).toBe('maintenance_plan'); // FREQUENT_REPAIRS rule category surfaces without the LLM
    expect(decision.channel).toBe('whatsapp'); // derived from recipientPhone, not the LLM
    expect(decision.offer).toBeNull(); // offer/bundle copy still requires an LLM sign-off
    expect(decision.message).toBeNull();
    expect(decision.priority).toBe('high'); // FREQUENT_REPAIRS is a highPriority rule match
    expect(decision.audit.ruleResult.reasonCode).toBe('FREQUENT_REPAIRS');
  });

  it('forces no_upsell when validation blocks the recommendation even though rules matched', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(llmRec);
    const service = buildService(llmRecommend);

    const decision = await service.decide({
      ...baseRequest,
      repairCount12Months: 3,
      sameOfferRecentlySent: true,
    });

    expect(decision.category).toBe('no_upsell');
    expect(decision.audit.validation.passed).toBe(false);
    expect(decision.audit.validation.failedChecks).toContain('DUPLICATE_OFFER');
  });

  it('returns no_upsell without calling the LLM when the safety gate suppresses an otherwise-matching customer', async () => {
    const llmRecommend = jest.fn();
    const service = buildService(llmRecommend);

    const decision = await service.decide({
      ...baseRequest,
      repairCount12Months: 3,
      automaticFollowupEnabled: false,
    });

    expect(decision.category).toBe('no_upsell');
    expect(llmRecommend).not.toHaveBeenCalled();
  });

  it('flags high priority for the equipment replacement rule', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(null);
    const service = buildService(llmRecommend);

    const decision = await service.decide({ ...baseRequest, equipmentAgeYears: 9 });

    expect(decision.audit.ruleResult.reasonCode).toBe('AGING_EQUIPMENT');
    expect(decision.audit.ruleResult.highPriority).toBe(true);
  });

  it('never lets the LLM change the category the rule engine decided on', async () => {
    const llmRecommend = jest.fn().mockResolvedValue({ ...llmRec, offer: 'Full System Replacement' });
    const service = buildService(llmRecommend);

    const decision = await service.decide({ ...baseRequest, repairCount12Months: 3 });

    expect(decision.category).toBe('maintenance_plan');
    expect(decision.offer).toBe('Full System Replacement');
  });
});
