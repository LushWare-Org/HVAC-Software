import { redact } from './redact';

describe('redact', () => {
  it('returns undefined for undefined input', () => {
    expect(redact(undefined)).toBeUndefined();
  });

  it('strips a top-level sensitive key, case-insensitively', () => {
    const result = redact({ email: 'a@b.com', Password: 'hunter2', token: 'abc' });
    expect(result).toEqual({ email: 'a@b.com', Password: '[REDACTED]', token: '[REDACTED]' });
  });

  it('strips sensitive keys nested inside objects and arrays', () => {
    const result = redact({
      customer: { name: 'Joe', cardNumber: '4111111111111111' },
      items: [{ secret: 'x' }, { label: 'ok' }],
    });
    expect(result).toEqual({
      customer: { name: 'Joe', cardNumber: '[REDACTED]' },
      items: [{ secret: '[REDACTED]' }, { label: 'ok' }],
    });
  });

  it('does not touch values whose key does not match the blocklist', () => {
    const result = redact({ authorNote: 'authorization is required for entry' });
    expect(result).toEqual({ authorNote: 'authorization is required for entry' });
  });

  it('truncates output past the byte cap', () => {
    const big = { blob: 'x'.repeat(5000) };
    const result = redact(big, 100) as any;
    expect(result.truncated).toBe(true);
  });
});
