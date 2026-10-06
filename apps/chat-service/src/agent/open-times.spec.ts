import { FIND_OPEN_TIMES } from './tools/open-times';
import type { AgentContext } from './types';

const staff: AgentContext = { companyId: 'co', userId: 'u', role: 'dispatcher', email: 'd@x', timezone: 'Asia/Dubai' };
const customer: AgentContext = { ...staff, role: 'customer', customerId: 'c-1' };
const slot = { start: '2026-10-08T05:00:00.000Z', end: '2026-10-08T06:30:00.000Z', technicianId: 't-1', technicianName: 'Kasun', travelKm: 3.2 };

function http(routes: Record<string, unknown>) {
  const seen: Array<{ path: string; params: any }> = [];
  return {
    seen,
    api: { get: async (_s: string, path: string, params?: any) => { seen.push({ path, params }); return routes[path]; } } as any,
  };
}

describe('find_open_times', () => {
  it('searches near the customer and shows times only', async () => {
    const h = http({ '/customers/me': { latitude: '25.08', longitude: '55.14' }, '/dispatch/slots': { days: 3, durationMins: 90, slots: [slot] } });
    const out: any = await FIND_OPEN_TIMES.run({ date: '2026-10-08' }, customer, h.api);
    expect(h.seen[1].params).toMatchObject({ from: '2026-10-08', days: 3, lat: '25.08', lng: '55.14' });
    expect(out.open).toEqual([{ start: slot.start, when: 'Thu 8 Oct, 9:00 am' }]);
  });

  it('for staff, searches near a job for its own length and names who is free', async () => {
    const h = http({
      '/jobs/j-1': { serviceLatitude: '25.2', serviceLongitude: '55.3', scheduledStart: '2026-10-07T05:00:00Z', scheduledEnd: '2026-10-07T07:00:00Z' },
      '/dispatch/slots': { days: 3, durationMins: 120, slots: [slot] },
    });
    const out: any = await FIND_OPEN_TIMES.run({ jobId: 'j-1', days: 99 }, staff, h.api);
    expect(h.seen[1].params).toMatchObject({ days: 14, durationMins: 120, lat: '25.2', lng: '55.3' });
    expect(out.open[0]).toMatchObject({ technician: 'Kasun', technicianId: 't-1', driveKm: 3.2 });
  });

  it('says plainly when nothing is open', async () => {
    const h = http({ '/customers/me': {}, '/dispatch/slots': { days: 3, slots: [] } });
    const out: any = await FIND_OPEN_TIMES.run({}, customer, h.api);
    expect(out).toEqual({ open: [], note: expect.stringContaining('Nothing open in the 3 days') });
  });
});
