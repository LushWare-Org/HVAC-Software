import type { FollowupRuleFacts } from '@tscrm/types';
import { FollowupRuleEngine } from './followup-rule-engine';

const baseFacts: FollowupRuleFacts = {
  entityType: 'customer',
  entityId: 'cust-1',
  companyId: 'co-1',
  previousFollowupAttempts: 0,
  automaticFollowupEnabled: true,
  hasContactChannel: true,
};

describe('FollowupRuleEngine', () => {
  let engine: FollowupRuleEngine;

  beforeEach(() => {
    engine = new FollowupRuleEngine();
  });

  describe('safety gates', () => {
    it('suppresses follow-up when the entity opted out', () => {
      const result = engine.evaluate({ ...baseFacts, automaticFollowupEnabled: false, daysSinceLastService: 200 });
      expect(result.needsFollowup).toBe(false);
      expect(result.action).toBeNull();
    });

    it('suppresses follow-up when previous attempts exceed the limit', () => {
      const result = engine.evaluate({ ...baseFacts, previousFollowupAttempts: 6, daysSinceLastService: 200 });
      expect(result.needsFollowup).toBe(false);
    });

    it('allows follow-up at exactly the attempt limit', () => {
      const result = engine.evaluate({ ...baseFacts, previousFollowupAttempts: 5, daysSinceLastService: 200 });
      expect(result.needsFollowup).toBe(true);
    });

    it('suppresses follow-up when there is no contact channel', () => {
      const result = engine.evaluate({ ...baseFacts, hasContactChannel: false, daysSinceLastService: 200 });
      expect(result.needsFollowup).toBe(false);
    });
  });

  describe('cold lead rule', () => {
    it('flags a lead older than 3 days in NEW status', () => {
      const result = engine.evaluate({
        ...baseFacts,
        entityType: 'lead',
        leadStatus: 'NEW',
        daysSinceLeadCreated: 4,
      });
      expect(result).toMatchObject({ needsFollowup: true, action: 'LEAD_FOLLOWUP', reasonCode: 'COLD_LEAD' });
    });

    it('does not flag a lead created 2 days ago', () => {
      const result = engine.evaluate({
        ...baseFacts,
        entityType: 'lead',
        leadStatus: 'NEW',
        daysSinceLeadCreated: 2,
      });
      expect(result.needsFollowup).toBe(false);
    });

    it('ignores a WON/LOST lead', () => {
      const result = engine.evaluate({
        ...baseFacts,
        entityType: 'lead',
        leadStatus: 'WON',
        daysSinceLeadCreated: 10,
      });
      expect(result.needsFollowup).toBe(false);
    });
  });

  describe('quote pending rule', () => {
    it('flags a SENT quote older than 3 days', () => {
      const result = engine.evaluate({ ...baseFacts, quoteStatus: 'SENT', daysSinceQuoteSent: 4 });
      expect(result).toMatchObject({ needsFollowup: true, action: 'QUOTE_FOLLOWUP', reasonCode: 'QUOTE_PENDING' });
    });

    it('flags a VIEWED-but-undecided quote older than 3 days', () => {
      const result = engine.evaluate({ ...baseFacts, quoteStatus: 'VIEWED', daysSinceQuoteSent: 5 });
      expect(result).toMatchObject({ needsFollowup: true, action: 'QUOTE_FOLLOWUP' });
    });

    it('does not flag an ACCEPTED quote', () => {
      const result = engine.evaluate({ ...baseFacts, quoteStatus: 'ACCEPTED', daysSinceQuoteSent: 10 });
      expect(result.needsFollowup).toBe(false);
    });
  });

  describe('agreement expired rule', () => {
    it('flags an EXPIRED agreement', () => {
      const result = engine.evaluate({ ...baseFacts, agreementStatus: 'EXPIRED' });
      expect(result).toMatchObject({ needsFollowup: true, action: 'RETENTION', reasonCode: 'AGREEMENT_EXPIRED' });
    });

    it('flags an ACTIVE agreement whose end date has passed', () => {
      const result = engine.evaluate({
        ...baseFacts,
        agreementStatus: 'ACTIVE',
        agreementEndDate: '2020-01-01T00:00:00Z',
      });
      expect(result).toMatchObject({ needsFollowup: true, action: 'RETENTION' });
    });

    it('does not flag an ACTIVE agreement with a future end date', () => {
      const result = engine.evaluate({
        ...baseFacts,
        agreementStatus: 'ACTIVE',
        agreementEndDate: '2099-01-01T00:00:00Z',
      });
      expect(result.needsFollowup).toBe(false);
    });
  });

  describe('re-engagement rule', () => {
    it('flags an INACTIVE customer', () => {
      const result = engine.evaluate({ ...baseFacts, engagementStatus: 'INACTIVE' });
      expect(result).toMatchObject({ needsFollowup: true, action: 'REENGAGEMENT', reasonCode: 'CUSTOMER_INACTIVE' });
    });

    it('flags a customer with no service in over 90 days', () => {
      const result = engine.evaluate({ ...baseFacts, daysSinceLastService: 91 });
      expect(result).toMatchObject({ needsFollowup: true, action: 'REENGAGEMENT' });
    });

    it('does not flag an active, recently-serviced customer', () => {
      const result = engine.evaluate({ ...baseFacts, daysSinceLastService: 10 });
      expect(result.needsFollowup).toBe(false);
    });
  });

  it('prioritizes lead follow-up over other rules for lead entities', () => {
    const result = engine.evaluate({
      ...baseFacts,
      entityType: 'lead',
      leadStatus: 'NEW',
      daysSinceLeadCreated: 5,
      daysSinceLastService: 200,
    });
    expect(result.action).toBe('LEAD_FOLLOWUP');
  });
});
