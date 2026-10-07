import { AGREEMENT_TOOLS } from './tools/office-agreements';
import { CREATE_JOB } from './tools/create-job';
import type { AgentContext } from './types';

const ctx: AgentContext = { companyId: 'co', userId: 'u', role: 'dispatcher', email: 'e', timezone: 'UTC', token: 'jwt' };
const http = (routes: Record<string, any>) => ({ get: async (s: string, p: string, q?: any) => { const v = routes[`GET ${s} ${p}`]; return typeof v === 'function' ? v(q) : v; } }) as any;
const now = new Date('2026-10-07T00:00:00Z');

describe('find_agreements_due', () => {
  it('lists active agreements due within the window, with any visit already waiting', async () => {
    const tool = AGREEMENT_TOOLS.find((t) => t.name === 'find_agreements_due')!;
    const h = http({
      'GET crm /agreements': { data: [
        { id: 'a1', name: 'Gold plan', status: 'ACTIVE', nextServiceDate: '2026-10-20T00:00:00Z', serviceType: 'AC Maintenance', customerId: 'c1', customer: { firstName: 'Ali', lastName: 'Hassan' } },
        { id: 'a2', name: 'Later', status: 'ACTIVE', nextServiceDate: '2027-03-01T00:00:00Z', customerId: 'c2', customer: { firstName: 'Bo', lastName: 'Lee' } },
        { id: 'a3', name: 'Old', status: 'EXPIRED', nextServiceDate: '2026-10-10T00:00:00Z', customerId: 'c3' },
      ] },
      'GET jobs /jobs': (q: any) => ({ data: q.agreementId === 'a1' ? [{ id: 'j9', jobNumber: 'JOB-0900', status: 'PENDING', scheduledStart: null }] : [] }),
    });
    const out = await tool.run({ days: 30, now: now.toISOString() }, ctx, h);
    expect(out).toEqual([{ agreementId: 'a1', agreement: 'Gold plan', service: 'AC Maintenance', customerId: 'c1', customer: 'Ali Hassan', due: '2026-10-20', waitingVisit: { jobId: 'j9', jobNumber: 'JOB-0900', status: 'PENDING', scheduled: false } }]);
  });
});

describe('create_job for an agreement', () => {
  it('refuses a second open visit for the same agreement and names the existing one', async () => {
    const h = http({
      'GET crm /customers/c1': { id: 'c1', firstName: 'Ali', lastName: 'Hassan', isActive: true, address: '1 Road', addresses: [] },
      'GET jobs /jobs': { data: [{ id: 'j9', jobNumber: 'JOB-0900', status: 'PENDING' }] },
    });
    await expect(CREATE_JOB.preview!({ customerId: 'c1', title: 'Service', agreementId: 'a1' }, ctx, h)).rejects.toThrow('JOB-0900 is already waiting for this agreement');
  });
});
