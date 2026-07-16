import type { UpsellLlmRecommendation } from '@tscrm/types';
import { UpsellValidationInput, UpsellValidationService } from './upsell-validation.service';

const baseInput: UpsellValidationInput = {
  ruleCategory: 'maintenance_plan',
  hasContactChannel: true,
  recipientPhone: '+15551234567',
  recipientEmail: undefined,
  previousUpsellAttempts: 0,
  automaticFollowupEnabled: true,
  sameOfferRecentlySent: false,
};

const baseLlmRec: UpsellLlmRecommendation = {
  offer: 'Premium Maintenance Plan',
  bundle: 'Annual Maintenance + Priority Support',
  priority: 'High',
  channel: 'whatsapp',
  reason: 'Frequent repairs in the last year',
  message: 'We noticed your system has required several repairs recently. Our maintenance plan can help.',
  confidence: 0.9,
};

describe('UpsellValidationService', () => {
  let service: UpsellValidationService;

  beforeEach(() => {
    service = new UpsellValidationService();
  });

  it('passes and preserves the LLM offer when everything checks out', () => {
    const result = service.validate(baseInput, baseLlmRec);
    expect(result.passed).toBe(true);
    expect(result.finalCategory).toBe('maintenance_plan');
    expect(result.finalChannel).toBe('whatsapp');
    expect(result.finalOffer).toBe(baseLlmRec.offer);
    expect(result.finalBundle).toBe(baseLlmRec.bundle);
    expect(result.finalMessage).toBe(baseLlmRec.message);
  });

  it('forces no_upsell when the customer opted out', () => {
    const result = service.validate({ ...baseInput, automaticFollowupEnabled: false }, baseLlmRec);
    expect(result.passed).toBe(false);
    expect(result.failedChecks).toContain('OPTED_OUT');
    expect(result.finalCategory).toBe('no_upsell');
    expect(result.finalMessage).toBeNull();
  });

  it('forces no_upsell when previous attempts hit the limit', () => {
    const result = service.validate({ ...baseInput, previousUpsellAttempts: 3 }, baseLlmRec);
    expect(result.failedChecks).toContain('ATTEMPT_LIMIT_EXCEEDED');
    expect(result.finalCategory).toBe('no_upsell');
  });

  it('forces no_upsell when there is no contact channel at all', () => {
    const result = service.validate({ ...baseInput, hasContactChannel: false, recipientPhone: undefined }, baseLlmRec);
    expect(result.failedChecks).toContain('NO_CONTACT_CHANNEL');
    expect(result.finalCategory).toBe('no_upsell');
  });

  it('forces no_upsell when the same offer was recently sent', () => {
    const result = service.validate({ ...baseInput, sameOfferRecentlySent: true }, baseLlmRec);
    expect(result.failedChecks).toContain('DUPLICATE_OFFER');
    expect(result.finalCategory).toBe('no_upsell');
  });

  it('substitutes an available channel rather than blocking the whole recommendation', () => {
    const result = service.validate(
      { ...baseInput, recipientPhone: undefined, recipientEmail: 'a@b.com' },
      { ...baseLlmRec, channel: 'whatsapp' },
    );
    expect(result.failedChecks).toContain('CHANNEL_UNAVAILABLE');
    expect(result.finalChannel).toBe('email');
    expect(result.finalCategory).toBe('maintenance_plan');
    expect(result.finalMessage).toBe(baseLlmRec.message);
  });

  it('forces no_upsell when no channel is deliverable at all', () => {
    const result = service.validate(
      { ...baseInput, recipientPhone: undefined, recipientEmail: undefined },
      baseLlmRec,
    );
    expect(result.finalChannel).toBeNull();
    expect(result.finalCategory).toBe('no_upsell');
  });

  it('falls back to a deliverable channel and no_upsell when there is no LLM recommendation', () => {
    const result = service.validate(baseInput, null);
    expect(result.finalChannel).toBe('whatsapp');
    expect(result.finalCategory).toBe('no_upsell');
    expect(result.finalMessage).toBeNull();
    expect(result.finalOffer).toBeNull();
  });

  it('rejects an oversized message but keeps the approved category', () => {
    const result = service.validate(baseInput, { ...baseLlmRec, message: 'x'.repeat(400) });
    expect(result.finalMessage).toBeNull();
    expect(result.finalCategory).toBe('maintenance_plan');
  });

  it('never lets the LLM change the category decided by the rule engine', () => {
    const result = service.validate(
      { ...baseInput, ruleCategory: 'replacement' },
      { ...baseLlmRec, offer: 'Full System Replacement' },
    );
    expect(result.finalCategory).toBe('replacement');
  });
});
