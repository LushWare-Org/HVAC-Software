import { VISIT_REMINDER_TOOLS, isConfirmedJob } from './tools/visit-reminders';
import { mapUnconfirmed } from '../kelvin/sources';

const tool = VISIT_REMINDER_TOOLS[0];
const NOW = new Date('2026-10-11T10:00:00Z');
const ctx: any = { companyId: 'c1', userId: 'u1', role: 'dispatcher', email: 'd@x.lk', timezone: 'Asia/Colombo' };
const job = (id: string, over: Record<string, unknown> = {}) => ({ id, jobNumber: `JOB-${id}`, customerName: `Cust ${id}`, status: 'SCHEDULED', assignedToId: 't1', scheduledStart: '2026-10-12T04:00:00Z', confirmedFor: null, ...over });

describe('mapUnconfirmed', () => {
  it('makes one card for visits in the next day that nobody confirmed', () => {
    const items = mapUnconfirmed([job('1'), job('2', { confirmedFor: '2026-10-12T04:00:00Z' }), job('3', { assignedToId: null })], NOW);
    expect(items).toHaveLength(1);
    expect(items[0].title).toContain('1 visit in the next day is not confirmed yet');
    expect(items[0].fixes[0].request).toContain('not confirmed');
  });
  it('says nothing when everything is confirmed or far away', () => {
    expect(mapUnconfirmed([job('1', { confirmedFor: '2026-10-12T04:00:00Z' }), job('2', { scheduledStart: '2026-10-20T04:00:00Z' })], NOW)).toEqual([]);
  });
  it('treats a moved visit as unconfirmed again', () => {
    expect(isConfirmedJob(job('1', { confirmedFor: '2026-10-12T03:00:00Z' }))).toBe(false);
  });
});

describe('remind_visits', () => {
  const http = (jobs: any[]) => ({ get: jest.fn().mockResolvedValue({ data: jobs }), post: jest.fn().mockResolvedValue({ customer: { email: 'sent', message: 'sent' }, technician: { message: 'sent' } }) }) as any;

  beforeAll(() => { jest.useFakeTimers().setSystemTime(NOW); });
  afterAll(() => { jest.useRealTimers(); });

  it('previews who gets what, and leaves out the already confirmed on request', async () => {
    const p = await tool.preview!({ when: 'next24h', onlyUnconfirmed: true, audience: 'both' }, ctx, http([job('1'), job('2', { confirmedFor: '2026-10-12T04:00:00Z' })]));
    expect(p.title).toBe('Remind about 1 visit');
    expect(p.args).toMatchObject({ jobIds: ['1'], audience: 'both', channels: ['message', 'email', 'push'] });
    expect(p.lines.join(' ')).toContain('the customer and the technician');
  });
  it('refuses when there is nothing to remind', async () => {
    await expect(tool.preview!({ when: 'tomorrow' }, ctx, http([]))).rejects.toThrow('nobody to remind');
    await expect(tool.preview!({}, ctx, http([]))).rejects.toThrow('Which visits');
  });
  it('runs the reminder for each visit on the chosen channels and reports honestly', async () => {
    const h = http([]);
    const r: any = await tool.run({ jobIds: ['1', '2'], audience: 'customer', channels: ['email'] }, ctx, h);
    expect(h.post).toHaveBeenCalledWith('jobs', '/jobs/1/send-reminder', { audience: 'customer', channels: ['email'] });
    expect(r.reminded).toBe(2);
    expect(r.details['customer email: sent']).toBe(2);
  });
  it('names a visit that failed instead of claiming success', async () => {
    const h = http([]);
    h.post.mockRejectedValueOnce({ response: { data: { message: 'not waiting for a reminder' } } });
    const r: any = await tool.run({ jobIds: ['1', '2'] }, ctx, h);
    expect(r.reminded).toBe(1);
    expect(r.failed[0]).toContain('not waiting for a reminder');
  });
  it('sends email as well as messages by default', () => {
    expect(tool.sends!({})).toContain('email');
  });
});
