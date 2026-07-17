import type { RevenueLlmRecommendation } from '@tscrm/types';
import { RevenueRuleEngine } from '../rules/revenue-rule-engine';
import { RevenueContextBuilder } from '../context/revenue-context-builder';
import { RevenueValidationService } from '../validation/revenue-validation.service';
import { RevenueDecisionRequest, RevenueDecisionService } from './revenue-decision.service';
import type { RevenueLlmClient } from '../../ai/revenue-llm.client';

const baseRequest: RevenueDecisionRequest = {
  customerId: 'cust-1',
  companyId: 'co-1',
  name: 'Jane Doe',
  customerSegment: 'standard',
  lifetimeSpend: 5000,
  equipment: [],
  hasActiveAgreement: true,
  openQuotes: [],
  overdueInvoices: [],
  daysSinceLastService: 10,
  automaticFollowupEnabled: true,
  previousRevenueAttempts: 0,
  sameOfferRecentlySent: false,
  recipientPhone: '+15551234567',
};

function buildService(llmRecommend: jest.Mock) {
  const llmClient = { recommend: llmRecommend } as unknown as RevenueLlmClient;
  return new RevenueDecisionService(
    new RevenueRuleEngine(),
    new RevenueContextBuilder(),
    llmClient,
    new RevenueValidationService(),
  );
}

const llmRec: RevenueLlmRecommendation = {
  strategy: 'Invoice collection outreach',
  recommendedAction: 'Call the customer and offer a payment plan',
  priority: 'High',
  expectedImpact: 'Recovers the overdue invoice balance',
  channel: 'whatsapp',
  reason: 'Invoice has been overdue for over a month',
  message: 'Your invoice is overdue — reply here or call us to arrange payment.',
  confidence: 0.85,
};

describe('RevenueDecisionService', () => {
  it('returns a no_opportunity decision without calling the LLM when rules find no opportunity', async () => {
    const llmRecommend = jest.fn();
    const service = buildService(llmRecommend);

    const decision = await service.decide(baseRequest);

    expect(decision.category).toBe('no_opportunity');
    expect(decision.channel).toBeNull();
    expect(llmRecommend).not.toHaveBeenCalled(); // LLM must never be consulted when rules find no opportunity
  });

  it('returns a decision using the LLM recommendation when rules find an overdue invoice', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(llmRec);
    const service = buildService(llmRecommend);

    const decision = await service.decide({
      ...baseRequest,
      overdueInvoices: [{ id: 'inv-1', daysOverdue: 45, amount: 750 }],
    });

    expect(decision.category).toBe('payment_collection');
    expect(decision.action).toBe(llmRec.recommendedAction);
    expect(decision.channel).toBe('whatsapp');
    expect(decision.message).toBe(llmRec.message);
    expect(decision.priority).toBe('high');
    expect(decision.expectedRevenueImpact).toBe(750);
    expect(decision.audit.ruleResult.reasonCode).toBe('OVERDUE_INVOICE');
    expect(decision.audit.llmRecommendation).toEqual(llmRec);
    expect(decision.audit.validation.passed).toBe(true);
  });

  it('falls back to a rule-only no_opportunity decision with canned reason when the LLM is unavailable', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(null);
    const service = buildService(llmRecommend);

    const decision = await service.decide({
      ...baseRequest,
      overdueInvoices: [{ id: 'inv-1', daysOverdue: 45, amount: 750 }],
    });

    expect(decision.category).toBe('no_opportunity'); // no LLM proposal to validate against policy
    expect(decision.channel).toBe('whatsapp'); // derived from recipientPhone, not the LLM
    expect(decision.message).toBeNull();
    expect(decision.audit.ruleResult.reasonCode).toBe('OVERDUE_INVOICE');
  });

  it('forces no_opportunity when validation blocks the recommendation even though rules matched', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(llmRec);
    const service = buildService(llmRecommend);

    const decision = await service.decide({
      ...baseRequest,
      overdueInvoices: [{ id: 'inv-1', daysOverdue: 45, amount: 750 }],
      sameOfferRecentlySent: true,
    });

    expect(decision.category).toBe('no_opportunity');
    expect(decision.audit.validation.passed).toBe(false);
    expect(decision.audit.validation.failedChecks).toContain('DUPLICATE_OFFER');
  });

  it('returns no_opportunity without calling the LLM when the safety gate suppresses an otherwise-matching customer', async () => {
    const llmRecommend = jest.fn();
    const service = buildService(llmRecommend);

    const decision = await service.decide({
      ...baseRequest,
      overdueInvoices: [{ id: 'inv-1', daysOverdue: 45, amount: 750 }],
      automaticFollowupEnabled: false,
    });

    expect(decision.category).toBe('no_opportunity');
    expect(llmRecommend).not.toHaveBeenCalled();
  });

  it('flags high priority for the overdue invoice rule', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(null);
    const service = buildService(llmRecommend);

    const decision = await service.decide({
      ...baseRequest,
      overdueInvoices: [{ id: 'inv-1', daysOverdue: 45, amount: 750 }],
    });

    expect(decision.audit.ruleResult.reasonCode).toBe('OVERDUE_INVOICE');
    expect(decision.audit.ruleResult.highPriority).toBe(true);
  });

  it('picks the maintenance_plan category for aging equipment with no active agreement', async () => {
    const llmRecommend = jest.fn().mockResolvedValue(null);
    const service = buildService(llmRecommend);

    const decision = await service.decide({
      ...baseRequest,
      hasActiveAgreement: false,
      equipment: [{ type: 'Boiler', ageYears: 9 }],
    });

    expect(decision.audit.ruleResult.category).toBe('maintenance_plan');
    expect(decision.audit.ruleResult.reasonCode).toBe('UPSELL_EQUIPMENT_AGE');
  });
});
