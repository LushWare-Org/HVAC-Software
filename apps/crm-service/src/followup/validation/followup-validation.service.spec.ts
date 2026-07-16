import type { FollowupLlmRecommendation } from '@tscrm/types';
import { FollowupValidationInput, FollowupValidationService } from './followup-validation.service';

const baseInput: FollowupValidationInput = {
  hasContactChannel: true,
  recipientPhone: '+15551234567',
  recipientEmail: undefined,
  previousFollowupAttempts: 0,
  automaticFollowupEnabled: true,
  recentFollowupExists: false,
};

const baseLlmRec: FollowupLlmRecommendation = {
  channel: 'SMS',
  priority: 'High',
  followupWithin: 'Today',
  reason: 'Quote pending for 4 days',
  message: 'Hi, following up on your quote.',
  confidence: 0.85,
};

describe('FollowupValidationService', () => {
  let service: FollowupValidationService;

  beforeEach(() => {
    service = new FollowupValidationService();
  });

  it('passes when everything checks out', () => {
    const result = service.validate(baseInput, baseLlmRec);
    expect(result.passed).toBe(true);
    expect(result.failedChecks).toEqual([]);
    expect(result.finalChannel).toBe('SMS');
    expect(result.finalMessage).toBe(baseLlmRec.message);
  });

  it('fails with no contact channel', () => {
    const result = service.validate({ ...baseInput, hasContactChannel: false, recipientPhone: undefined }, baseLlmRec);
    expect(result.passed).toBe(false);
    expect(result.failedChecks).toContain('NO_CONTACT_CHANNEL');
  });

  it('fails when previous attempts exceed the limit', () => {
    const result = service.validate({ ...baseInput, previousFollowupAttempts: 6 }, baseLlmRec);
    expect(result.passed).toBe(false);
    expect(result.failedChecks).toContain('ATTEMPT_LIMIT_EXCEEDED');
  });

  it('fails when the entity opted out', () => {
    const result = service.validate({ ...baseInput, automaticFollowupEnabled: false }, baseLlmRec);
    expect(result.passed).toBe(false);
    expect(result.failedChecks).toContain('OPTED_OUT');
  });

  it('fails when the follow-up interval is not satisfied', () => {
    const result = service.validate({ ...baseInput, recentFollowupExists: true }, baseLlmRec);
    expect(result.passed).toBe(false);
    expect(result.failedChecks).toContain('INTERVAL_NOT_SATISFIED');
  });

  it('falls back to an available channel when the LLM recommends an unavailable one', () => {
    const result = service.validate(
      { ...baseInput, recipientPhone: undefined, recipientEmail: 'a@b.com' },
      { ...baseLlmRec, channel: 'SMS' },
    );
    expect(result.failedChecks).toContain('CHANNEL_UNAVAILABLE');
    expect(result.finalChannel).toBe('EMAIL');
  });

  it('fails when no channel is deliverable at all', () => {
    const result = service.validate(
      { ...baseInput, recipientPhone: undefined, recipientEmail: undefined },
      baseLlmRec,
    );
    expect(result.passed).toBe(false);
    expect(result.failedChecks).toContain('NO_DELIVERABLE_CHANNEL');
    expect(result.finalChannel).toBeNull();
  });

  it('falls back to a deliverable channel when there is no LLM recommendation', () => {
    const result = service.validate(baseInput, null);
    expect(result.finalChannel).toBe('SMS');
    expect(result.finalMessage).toBeNull();
  });

  it('rejects an oversized message', () => {
    const result = service.validate(baseInput, { ...baseLlmRec, message: 'x'.repeat(400) });
    expect(result.finalMessage).toBeNull();
  });

  it('maps followupWithin to a scheduled timestamp, "Today" means send now', () => {
    const now = service.validate(baseInput, { ...baseLlmRec, followupWithin: 'Today' });
    expect(now.scheduledFor).toBeNull();

    const later = service.validate(baseInput, { ...baseLlmRec, followupWithin: 'This week' });
    expect(later.scheduledFor).not.toBeNull();
    expect(new Date(later.scheduledFor as string).getTime()).toBeGreaterThan(Date.now());
  });
});
