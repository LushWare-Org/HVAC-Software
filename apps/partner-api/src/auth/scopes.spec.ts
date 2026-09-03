import { hasScope, isKnownScope, scopeSatisfies, PARTNER_SCOPES } from './scopes';

describe('scope matching', () => {
  it('matches an exact scope', () => {
    expect(scopeSatisfies('booking:create', 'booking:create')).toBe(true);
  });

  it('does not match a different scope on the same resource', () => {
    expect(scopeSatisfies('booking:create', 'booking:cancel')).toBe(false);
  });

  it('matches via a resource wildcard', () => {
    expect(scopeSatisfies('booking:*', 'booking:cancel')).toBe(true);
  });

  it('does not let a resource wildcard leak into another resource', () => {
    expect(scopeSatisfies('booking:*', 'payment_link:create')).toBe(false);
  });

  it('matches everything with the global wildcard', () => {
    expect(scopeSatisfies('*', 'payment_link:create')).toBe(true);
  });

  it('refuses a prefix that is not a scope boundary', () => {
    // "book:*" must not satisfy "booking:create"
    expect(scopeSatisfies('book:*', 'booking:create')).toBe(false);
  });

  it('checks a granted list', () => {
    const granted = [PARTNER_SCOPES.CUSTOMER_LOOKUP, PARTNER_SCOPES.BOOKING_CREATE];
    expect(hasScope(granted, PARTNER_SCOPES.BOOKING_CREATE)).toBe(true);
    expect(hasScope(granted, PARTNER_SCOPES.PAYMENT_LINK_CREATE)).toBe(false);
  });

  it('rejects scopes outside the catalogue', () => {
    expect(isKnownScope('customer:lookup')).toBe(true);
    expect(isKnownScope('customer:list')).toBe(false);
    expect(isKnownScope('database:drop')).toBe(false);
    expect(isKnownScope('invoice:*')).toBe(true);
    expect(isKnownScope('nonsense:*')).toBe(false);
  });

  it('has no scope that would allow enumerating customers', () => {
    const values: string[] = Object.values(PARTNER_SCOPES);
    expect(values).not.toContain('customer:list');
    expect(values).not.toContain('customer:search');
  });
});
