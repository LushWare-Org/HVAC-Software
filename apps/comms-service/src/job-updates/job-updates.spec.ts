import { JobUpdatesService, jobUpdateText } from './job-updates.service';
import { estimateEtaWindow } from '../enroute/enroute.service';

describe('job update wording', () => {
  const base = { companyId: 'co', customerId: 'c1', jobId: 'j1', jobTitle: 'AC service', technicianName: 'RP Tech' };
  it('says what happened, plainly', () => {
    expect(jobUpdateText({ ...base, status: 'EN_ROUTE', arrivalWindow: 'between 2:40 PM and 3:00 PM' })).toBe('RP Tech is on the way to you for AC service. Expected between 2:40 PM and 3:00 PM.');
    expect(jobUpdateText({ ...base, status: 'ON_SITE' })).toBe('RP Tech has arrived and is starting work on AC service.');
    expect(jobUpdateText({ ...base, status: 'COMPLETED' })).toBe('AC service is complete. Thank you! You can see the details in your portal.');
    expect(jobUpdateText({ ...base, status: 'CANCELLED', scheduledLabel: 'Mon 12 Oct, 9:00', note: 'Parts are delayed' })).toBe("AC service on Mon 12 Oct, 9:00 has been cancelled. Parts are delayed. Reply here if you'd like to book another time.");
    expect(jobUpdateText({ ...base, status: 'INVOICED' })).toBeNull();
  });
});

describe('posting a job update', () => {
  it('posts once per job, status and day as the company, with the photo', async () => {
    const chat: any = { openOffice: jest.fn(async () => ({ id: 'conv-1' })), send: jest.fn(async () => ({})) };
    const svc = new JobUpdatesService(chat);
    await svc.post({ companyId: 'co', customerId: 'c1', jobId: 'j1', status: 'EN_ROUTE', technicianName: 'RP', techPhotoUrl: 'https://cdn/x.jpg' });
    const [viewer, conv, input] = chat.send.mock.calls[0];
    expect(viewer.userId.startsWith('system-')).toBe(true);
    expect(conv).toBe('conv-1');
    expect(input.clientId).toMatch(/^job:j1:EN_ROUTE:\d{4}-\d{2}-\d{2}$/);
    expect(input.attachments).toEqual([{ url: 'https://cdn/x.jpg', name: 'RP', type: 'image/jpeg' }]);
  });
  it('never throws, and skips customers it cannot reach', async () => {
    const chat: any = { openOffice: jest.fn(async () => { throw new Error('nope'); }), send: jest.fn() };
    const svc = new JobUpdatesService(chat);
    expect(await svc.post({ companyId: 'co', customerId: 'c1', jobId: 'j1', status: 'ON_SITE' })).toBe(false);
    expect(await svc.post({ companyId: 'co', customerId: null, jobId: 'j1', status: 'ON_SITE' })).toBe(false);
  });
});

describe('arrival window', () => {
  const now = new Date('2026-10-09T05:00:00Z');
  it('from the live position: straight line at 30 km/h plus 15%, a 20-minute window', () => {
    const w = estimateEtaWindow({ lat: 6.9, lng: 79.85 }, { lat: 6.99, lng: 79.85 }, null, null, now)!; // ~10 km → ~23 min
    expect(w.start.toISOString()).toBe('2026-10-09T05:20:00.000Z');
    expect(w.end.getTime() - w.start.getTime()).toBe(20 * 60_000);
  });
  it('without a position, the booked time', () => {
    const s = new Date('2026-10-09T06:00:00Z');
    expect(estimateEtaWindow(null, null, s, null, now)).toEqual({ start: s, end: new Date('2026-10-09T07:00:00Z') });
    expect(estimateEtaWindow(null, null, null, null, now)).toBeNull();
  });
});
