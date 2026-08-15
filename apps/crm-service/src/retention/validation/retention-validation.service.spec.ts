import type { RetentionLlmRecommendation } from '@tscrm/types';
import { RetentionValidationInput, RetentionValidationService } from './retention-validation.service';

const baseInput: RetentionValidationInput = {
  ruleAction: 'maintenance_plan_offer',
  hasContactChannel: true,
  recipientPhone: '+15551234567',
  recipientEmail: undefined,
  previousRetentionAttempts: 0,
  automaticFollowupEnabled: true,
  sameOfferRecentlySent: false,
};

const baseLlmRec: RetentionLlmRecommendation = {
  strategy: 'Maintenance plan enrollment',
  action: 'maintenance_plan_offer',
  priority: 'High',
  channel: 'whatsapp',
  reason: 'Frequent repairs in the last year',
  message: 'We would like to offer a maintenance plan to reduce future repair costs.',
  confidence: 0.9,
};

describe('RetentionValidationService', () => {
  let service: RetentionValidationService;

  beforeEach(() => {
    service = new RetentionValidationService();
  });

  it('passes and preserves the LLM offer when everything checks out', () => {
    const result = service.validate(baseInput, baseLlmRec);
    expect(result.passed).toBe(true);
    expect(result.finalAction).toBe('maintenance_plan_offer');
    expect(result.finalChannel).toBe('whatsapp');
    expect(result.finalMessage).toBe(baseLlmRec.message);
    expect(result.finalOffer).toEqual({ type: 'standard', discount: 10 });
  });

  it('forces no_action when the customer opted out', () => {
    const result = service.validate({ ...baseInput, automaticFollowupEnabled: false }, baseLlmRec);
    expect(result.passed).toBe(false);
    expect(result.failedChecks).toContain('OPTED_OUT');
    expect(result.finalAction).toBe('no_action');
    expect(result.finalMessage).toBeNull();
  });

  it('forces no_action when previous retention attempts hit the limit', () => {
    const result = service.validate({ ...baseInput, previousRetentionAttempts: 3 }, baseLlmRec);
    expect(result.failedChecks).toContain('ATTEMPT_LIMIT_EXCEEDED');
    expect(result.finalAction).toBe('no_action');
  });

  it('forces no_action when there is no contact channel at all', () => {
    const result = service.validate({ ...baseInput, hasContactChannel: false, recipientPhone: undefined }, baseLlmRec);
    expect(result.failedChecks).toContain('NO_CONTACT_CHANNEL');
    expect(result.finalAction).toBe('no_action');
  });

  it('forces no_action when the same offer was recently sent', () => {
    const result = service.validate({ ...baseInput, sameOfferRecentlySent: true }, baseLlmRec);
    expect(result.failedChecks).toContain('DUPLICATE_OFFER');
    expect(result.finalAction).toBe('no_action');
  });

  it('substitutes an available channel rather than blocking the whole recommendation', () => {
    const result = service.validate(
      { ...baseInput, recipientPhone: undefined, recipientEmail: 'a@b.com' },
      { ...baseLlmRec, channel: 'whatsapp' },
    );
    expect(result.failedChecks).toContain('CHANNEL_UNAVAILABLE');
    expect(result.finalChannel).toBe('email');
    expect(result.finalAction).toBe('maintenance_plan_offer');
    expect(result.finalMessage).toBe(baseLlmRec.message);
  });

  it('forces no_action when no channel is deliverable at all', () => {
    const result = service.validate(
      { ...baseInput, recipientPhone: undefined, recipientEmail: undefined },
      baseLlmRec,
    );
    expect(result.finalChannel).toBeNull();
    expect(result.finalAction).toBe('no_action');
  });

  it('falls back to the rule-decided action (still no message) when there is no LLM recommendation', () => {
    const result = service.validate(baseInput, null);
    expect(result.finalChannel).toBe('whatsapp');
    expect(result.finalAction).toBe('maintenance_plan_offer');
    expect(result.finalOffer).toEqual({ type: 'standard', discount: 10 });
    expect(result.finalMessage).toBeNull();
  });

  it('still forces no_action when there is no LLM recommendation and no contact channel', () => {
    const result = service.validate(
      { ...baseInput, hasContactChannel: false, recipientPhone: undefined },
      null,
    );
    expect(result.finalAction).toBe('no_action');
  });

  it('rejects an oversized message but keeps the approved action', () => {
    const result = service.validate(baseInput, { ...baseLlmRec, message: 'x'.repeat(400) });
    expect(result.finalMessage).toBeNull();
    expect(result.finalAction).toBe('maintenance_plan_offer');
  });

  it('always resolves the policy discount from the finalAction, never from the LLM', () => {
    const result = service.validate(baseInput, { ...baseLlmRec, action: 'discount_retention_offer' });
    expect(result.finalOffer).toEqual({ type: 'discounted', discount: 20 });
  });
});
