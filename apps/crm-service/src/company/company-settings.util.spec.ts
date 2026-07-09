import { isFeatureEnabled, DEFAULT_COMPANY_SETTINGS } from '@tscrm/types';

describe('isFeatureEnabled', () => {
  it('missing key means enabled', () => {
    expect(isFeatureEnabled({}, 'onlinePayments')).toBe(true);
  });

  it('explicit false disables', () => {
    expect(isFeatureEnabled({ sms: false }, 'sms')).toBe(false);
  });

  it('explicit true enables', () => {
    expect(isFeatureEnabled({ sms: true }, 'sms')).toBe(true);
  });

  it('non-object features fails open', () => {
    expect(isFeatureEnabled(null, 'sms')).toBe(true);
    expect(isFeatureEnabled('garbage', 'sms')).toBe(true);
    expect(isFeatureEnabled(42, 'sms')).toBe(true);
  });

  it('non-boolean value fails open', () => {
    expect(isFeatureEnabled({ sms: 'no' }, 'sms')).toBe(true);
  });
});

describe('DEFAULT_COMPANY_SETTINGS', () => {
  it('is USD / America/New_York / empty features', () => {
    expect(DEFAULT_COMPANY_SETTINGS).toEqual({
      currency: 'USD',
      timezone: 'America/New_York',
      features: {},
    });
  });
});
