import type { RevenueLlmRecommendation } from '@tscrm/types';
import { RevenueValidationInput, RevenueValidationService } from './revenue-validation.service';

const baseInput: RevenueValidationInput = {
  ruleCategory: 'payment_collection',
  expectedRevenueImpact: 750,
  hasContactChannel: true,
  recipientPhone: '+15551234567',
  recipientEmail: undefined,
  previousRevenueAttempts: 0,
  automaticFollowupEnabled: true,
  sameOfferRecentlySent: false,
};

const baseLlmRec: RevenueLlmRecommendation = {
  strategy: 'Invoice collection outreach',
  recommendedAction: 'Call the customer and offer a payment plan',
  priority: 'High',
  expectedImpact: 'Recover the overdue invoice balance',
  channel: 'whatsapp',
  reason: 'Invoice has been overdue for over a month',
  message: 'Your invoice is overdue — reply here or call us to arrange payment.',
  confidence: 0.85,
};

describe('RevenueValidationService', () => {
  let service: RevenueValidationService;

  beforeEach(() => {
    service = new RevenueValidationService();
  });

  it('passes and preserves the LLM recommendation when everything checks out', () => {
    const result = service.validate(baseInput, baseLlmRec);
    expect(result.passed).toBe(true);
    expect(result.finalCategory).toBe('payment_collection');
    expect(result.finalAction).toBe(baseLlmRec.recommendedAction);
    expect(result.finalChannel).toBe('whatsapp');
    expect(result.finalMessage).toBe(baseLlmRec.message);
    expect(result.finalExpectedImpact).toBe(750);
  });

  it('forces no_opportunity when the customer opted out', () => {
    const result = service.validate({ ...baseInput, automaticFollowupEnabled: false }, baseLlmRec);
    expect(result.passed).toBe(false);
    expect(result.failedChecks).toContain('OPTED_OUT');
    expect(result.finalCategory).toBe('no_opportunity');
    expect(result.finalMessage).toBeNull();
    expect(result.finalExpectedImpact).toBeNull();
  });

  it('forces no_opportunity when previous revenue attempts hit the limit', () => {
    const result = service.validate({ ...baseInput, previousRevenueAttempts: 3 }, baseLlmRec);
    expect(result.failedChecks).toContain('ATTEMPT_LIMIT_EXCEEDED');
    expect(result.finalCategory).toBe('no_opportunity');
  });

  it('forces no_opportunity when there is no contact channel at all', () => {
    const result = service.validate({ ...baseInput, hasContactChannel: false, recipientPhone: undefined }, baseLlmRec);
    expect(result.failedChecks).toContain('NO_CONTACT_CHANNEL');
    expect(result.finalCategory).toBe('no_opportunity');
  });

  it('forces no_opportunity when the same offer was recently sent', () => {
    const result = service.validate({ ...baseInput, sameOfferRecentlySent: true }, baseLlmRec);
    expect(result.failedChecks).toContain('DUPLICATE_OFFER');
    expect(result.finalCategory).toBe('no_opportunity');
  });

  it('substitutes an available channel rather than blocking the whole recommendation', () => {
    const result = service.validate(
      { ...baseInput, recipientPhone: undefined, recipientEmail: 'a@b.com' },
      { ...baseLlmRec, channel: 'whatsapp' },
    );
    expect(result.failedChecks).toContain('CHANNEL_UNAVAILABLE');
    expect(result.finalChannel).toBe('email');
    expect(result.finalCategory).toBe('payment_collection');
    expect(result.finalMessage).toBe(baseLlmRec.message);
  });

  it('forces no_opportunity when no channel is deliverable at all', () => {
    const result = service.validate(
      { ...baseInput, recipientPhone: undefined, recipientEmail: undefined },
      baseLlmRec,
    );
    expect(result.finalChannel).toBeNull();
    expect(result.finalCategory).toBe('no_opportunity');
  });

  it('falls back to the rule-decided category (still no action copy) when there is no LLM recommendation', () => {
    const result = service.validate(baseInput, null);
    expect(result.finalChannel).toBe('whatsapp');
    expect(result.finalCategory).toBe('payment_collection');
    expect(result.finalAction).toBeNull();
    expect(result.finalMessage).toBeNull();
    expect(result.finalExpectedImpact).toBe(750);
  });

  it('still forces no_opportunity when there is no LLM recommendation and no contact channel', () => {
    const result = service.validate(
      { ...baseInput, hasContactChannel: false, recipientPhone: undefined },
      null,
    );
    expect(result.finalCategory).toBe('no_opportunity');
    expect(result.finalExpectedImpact).toBeNull();
  });

  it('rejects an oversized message but keeps the approved category/action', () => {
    const result = service.validate(baseInput, { ...baseLlmRec, message: 'x'.repeat(400) });
    expect(result.finalMessage).toBeNull();
    expect(result.finalCategory).toBe('payment_collection');
    expect(result.finalAction).toBe(baseLlmRec.recommendedAction);
  });

  it('never lets the LLM change the rule-decided category', () => {
    const result = service.validate({ ...baseInput, ruleCategory: 'quote_recovery' }, baseLlmRec);
    expect(result.finalCategory).toBe('quote_recovery');
  });
});
