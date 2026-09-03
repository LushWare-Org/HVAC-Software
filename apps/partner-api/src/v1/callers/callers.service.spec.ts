import { CallersService } from './callers.service';
import { ServiceClient } from '../../internal/service-client.service';

const CUSTOMER = {
  id: 'cus-1',
  firstName: 'Sarah',
  lastName: 'Jones',
  type: 'RESIDENTIAL',
  email: 'sarah@example.test',
  phone: '0771234567',
  mobile: null,
  address: '12 Baker Street',
  city: 'Colombo',
  zipCode: '00300',
  createdAt: '2023-04-01T00:00:00.000Z',
  tags: ['VIP'],
  isVip: true,
  hasServiceAgreement: true,
};

function makeClient(routes: Record<string, unknown>) {
  const client = {
    get: jest.fn(async (_svc: string, path: string) => {
      if (!(path in routes)) throw new Error(`unexpected GET ${path}`);
      const value = routes[path];
      if (value instanceof Error) throw value;
      return value;
    }),
    post: jest.fn(async (_svc: string, path: string) => {
      if (!(path in routes)) throw new Error(`unexpected POST ${path}`);
      return routes[path];
    }),
    optional: async <T>(_label: string, fn: () => Promise<T>, fallback: T) => {
      try {
        return await fn();
      } catch {
        return fallback;
      }
    },
  };
  return client as unknown as ServiceClient & typeof client;
}

describe('CallersService', () => {
  it('reports not_found without fetching any history', async () => {
    const client = makeClient({
      '/customers/lookup/by-phone': { result: 'not_found' },
    });
    const service = new CallersService(client);

    const profile = await service.lookupByPhone('co-1', '0000');
    expect(profile).toEqual({ result: 'not_found' });
    // Only the lookup itself — no jobs/invoices/quotes calls for a stranger.
    expect(client.get).toHaveBeenCalledTimes(1);
  });

  it('reports ambiguous with the match count and no customer data', async () => {
    const client = makeClient({
      '/customers/lookup/by-phone': { result: 'ambiguous', matches: 3 },
    });
    const service = new CallersService(client);

    const profile = await service.lookupByPhone('co-1', '0771234567');
    expect(profile).toEqual({ result: 'ambiguous', matches: 3 });
    expect(profile.customer).toBeUndefined();
  });

  it('builds a caller profile with a summary', async () => {
    const client = makeClient({
      '/customers/lookup/by-phone': { result: 'found', customer: CUSTOMER },
      '/jobs': {
        data: [
          { id: 'j1', type: 'REPAIR', status: 'SCHEDULED', scheduledAt: '2026-09-05T09:00:00Z' },
          { id: 'j2', type: 'SERVICE', status: 'COMPLETED', scheduledAt: '2026-03-02T09:00:00Z' },
        ],
      },
      // Decimal(10,2) is serialized as a string — must survive arithmetic.
      '/invoices': {
        data: [
          { id: 'i1', status: 'PARTIALLY_PAID', balanceDue: '340.50' },
          { id: 'i2', status: 'PAID', balanceDue: '0.00' },
        ],
      },
      '/quotes': { data: [{ id: 'q1', status: 'SENT' }, { id: 'q2', status: 'ACCEPTED' }] },
      '/customers/cus-1/equipment': [{ id: 'e1' }, { id: 'e2' }],
    });
    const service = new CallersService(client);

    const profile = await service.lookupByPhone('co-1', '0771234567');

    expect(profile.result).toBe('found');
    expect(profile.customer).toMatchObject({
      fullName: 'Sarah Jones',
      isVip: true,
      hasServiceAgreement: true,
    });
    expect(profile.summary).toMatchObject({
      openJobs: 1,
      totalJobs: 2,
      equipmentCount: 2,
      unpaidInvoices: 1,
      balanceDue: 340.5,
      openQuotes: 1,
      degraded: [],
    });
    expect(profile.summary?.lastJob?.id).toBe('j1');
  });

  it('still greets the caller when finance is down, and says so', async () => {
    const client = makeClient({
      '/customers/lookup/by-phone': { result: 'found', customer: CUSTOMER },
      '/jobs': { data: [{ id: 'j1', status: 'SCHEDULED' }] },
      '/invoices': new Error('finance unreachable'),
      '/quotes': new Error('finance unreachable'),
      '/customers/cus-1/equipment': [],
    });
    const service = new CallersService(client);

    const profile = await service.lookupByPhone('co-1', '0771234567');

    expect(profile.result).toBe('found');
    expect(profile.customer?.fullName).toBe('Sarah Jones');
    // A zero here would be a lie the agent might read out loud.
    expect(profile.summary?.degraded).toEqual(['invoices', 'quotes']);
    expect(profile.summary?.balanceDue).toBe(0);
    expect(profile.summary?.openJobs).toBe(1);
  });

  it('matches by name and address through the CRM match endpoint', async () => {
    const client = makeClient({
      '/customers/lookup/match': { result: 'found', customer: CUSTOMER },
      '/jobs': { data: [] },
      '/invoices': { data: [] },
      '/quotes': { data: [] },
      '/customers/cus-1/equipment': [],
    });
    const service = new CallersService(client);

    const profile = await service.matchByNameAndAddress('co-1', {
      firstName: 'Sarah',
      lastName: 'Jones',
      address: '12 Baker Street',
    });

    expect(profile.result).toBe('found');
    expect(client.post).toHaveBeenCalledWith(
      'crm',
      '/customers/lookup/match',
      'co-1',
      expect.objectContaining({ lastName: 'Jones' }),
    );
  });
});

describe('CallersService — draft invoices', () => {
  it('does not tell a caller they owe money for an unissued invoice', async () => {
    const client = makeClient({
      '/customers/lookup/by-phone': { result: 'found', customer: CUSTOMER },
      '/jobs': { data: [] },
      '/invoices': {
        data: [
          { id: 'i1', status: 'SENT', balanceDue: '340.50' },
          { id: 'i2', status: 'DRAFT', balanceDue: '120.00' },
        ],
      },
      '/quotes': { data: [] },
      '/customers/cus-1/equipment': [],
    });
    const service = new CallersService(client);

    const profile = await service.lookupByPhone('co-1', '0771234567');

    expect(profile.summary?.balanceDue).toBe(340.5);
    expect(profile.summary?.unpaidInvoices).toBe(1);
  });
});
