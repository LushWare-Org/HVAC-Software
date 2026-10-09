import { isConfirmed, reminderDue, zonedToUtc, localDate, addDays } from './visit-care';
import { VisitCareService } from './visit-care.service';
import axios from 'axios';

jest.mock('axios');

const TZ = 'Asia/Colombo'; // UTC+5:30, no daylight saving
const at = (iso: string) => new Date(iso);

describe('zones', () => {
  it('turns 18:00 in Colombo into 12:30 UTC', () => {
    expect(zonedToUtc('2026-10-11', 18, TZ).toISOString()).toBe('2026-10-11T12:30:00.000Z');
  });
  it('reads the local date and steps days', () => {
    expect(localDate(at('2026-10-11T20:00:00Z'), TZ)).toBe('2026-10-12'); // already tomorrow in Colombo
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });
});

describe('reminderDue', () => {
  const job = (over: Record<string, unknown> = {}) => ({ scheduledStart: at('2026-10-12T04:00:00Z'), ...over }); // 9:30 AM Colombo
  it('sends the evening reminder from 18:00 the day before', () => {
    expect(reminderDue(job(), at('2026-10-11T12:00:00Z'), TZ)).toBeNull(); // 17:30 Colombo, too early
    expect(reminderDue(job(), at('2026-10-11T12:31:00Z'), TZ)).toBe('EVE');
  });
  it('sends it once per start time, and again if the visit moves', () => {
    const sent = job({ remindedEveFor: at('2026-10-12T04:00:00Z') });
    expect(reminderDue(sent, at('2026-10-11T13:00:00Z'), TZ)).toBeNull();
    expect(reminderDue({ ...sent, scheduledStart: at('2026-10-12T05:00:00Z') }, at('2026-10-11T13:00:00Z'), TZ)).toBe('EVE');
  });
  it('sends the "soon" reminder three hours ahead, but not once it is too late to matter', () => {
    const j = job({ remindedEveFor: at('2026-10-12T04:00:00Z') });
    expect(reminderDue(j, at('2026-10-12T00:59:00Z'), TZ)).toBeNull();
    expect(reminderDue(j, at('2026-10-12T01:05:00Z'), TZ)).toBe('SOON');
    expect(reminderDue(j, at('2026-10-12T03:50:00Z'), TZ)).toBeNull(); // 10 minutes away
    expect(reminderDue(j, at('2026-10-12T04:05:00Z'), TZ)).toBeNull(); // started
  });
  it('skips the evening reminder for a visit that is less than 12 hours away', () => {
    expect(reminderDue(job({ scheduledStart: at('2026-10-11T22:00:00Z') }), at('2026-10-11T13:00:00Z'), TZ)).toBeNull();
  });
  it('waits after a booking message so the customer is not messaged twice in a row', () => {
    const j = job({ notifiedAt: at('2026-10-11T12:00:00Z') });
    expect(reminderDue(j, at('2026-10-11T13:00:00Z'), TZ)).toBeNull();
    expect(reminderDue(j, at('2026-10-11T15:31:00Z'), TZ)).toBe('EVE');
  });
  it('aims at the start of an arrival window', () => {
    const w = job({ timeMode: 'WINDOW', windowStart: at('2026-10-12T02:30:00Z') }); // 8:00 AM Colombo
    expect(reminderDue(w, at('2026-10-11T23:31:00Z'), TZ)).toBe('SOON');
  });
});

describe('isConfirmed', () => {
  it('holds only for the time that was confirmed', () => {
    expect(isConfirmed({ scheduledStart: at('2026-10-12T04:00:00Z'), confirmedFor: at('2026-10-12T04:00:00Z') })).toBe(true);
    expect(isConfirmed({ scheduledStart: at('2026-10-12T05:00:00Z'), confirmedFor: at('2026-10-12T04:00:00Z') })).toBe(false);
    expect(isConfirmed({ scheduledStart: at('2026-10-12T05:00:00Z') })).toBe(false);
  });
});

describe('VisitCareService', () => {
  const START = at('2026-10-12T04:00:00Z');
  const jobRow = (over: Record<string, unknown> = {}) => ({
    id: 'j1', companyId: 'c1', status: 'SCHEDULED', customerId: 'cu1', customerName: 'Hana', customerEmail: 'h@x.lk', title: 'AC repair',
    jobNumber: 'JOB-1', serviceAddress: '1 Main St', assignedToId: 't1', assignedToName: 'Silva', scheduledStart: START,
    timeMode: 'EXACT', windowStart: null, windowEnd: null, confirmedFor: null, ...over,
  });
  const make = (row: any) => {
    const prisma: any = {
      job: { findFirst: jest.fn().mockResolvedValue(row), update: jest.fn().mockReturnValue('u'), updateMany: jest.fn().mockResolvedValue({ count: 1 }), findMany: jest.fn().mockResolvedValue([row]) },
      jobStatusHistory: { create: jest.fn().mockReturnValue('h') },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const crm: any = { getTimezone: jest.fn().mockResolvedValue(TZ), getCustomerContact: jest.fn() };
    const events: any = { publish: jest.fn() };
    return { prisma, svc: new VisitCareService(prisma, crm, events), events };
  };
  const customer: any = { userId: 'u1', companyId: 'c1', role: 'customer', customerId: 'cu1', name: 'Hana' };
  beforeEach(() => { (axios.post as jest.Mock).mockReset().mockResolvedValue({ data: { customer: { email: 'sent' } } }); });

  it('lets a customer confirm their own visit and tells the dashboard', async () => {
    const { svc, events, prisma } = make(jobRow());
    expect(await svc.confirm('c1', 'j1', customer)).toMatchObject({ confirmed: true });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(events.publish).toHaveBeenCalled();
  });
  it('refuses someone else\'s visit and a visit with no time', async () => {
    await expect(make(jobRow({ customerId: 'other' })).svc.confirm('c1', 'j1', customer)).rejects.toThrow('your own');
    await expect(make(jobRow({ scheduledStart: null })).svc.confirm('c1', 'j1', customer)).rejects.toThrow('no booked time');
  });
  it('does nothing twice', async () => {
    const { svc, prisma } = make(jobRow({ confirmedFor: START }));
    expect(await svc.confirm('c1', 'j1', customer)).toMatchObject({ already: true });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('sends a reminder with who, what and whether it is confirmed', async () => {
    const { svc } = make(jobRow());
    await svc.sendReminder('c1', 'j1', { audience: 'both', channels: ['email', 'message'] });
    expect((axios.post as jest.Mock).mock.calls[0][1]).toMatchObject({ kind: 'MANUAL', audience: 'both', channels: ['email', 'message'], technicianUserId: 't1', confirmed: false, customerId: 'cu1' });
  });
  it('the sweep claims a due reminder once and sends it', async () => {
    const { svc, prisma } = make(jobRow());
    expect(await svc.sweep(at('2026-10-11T13:00:00Z'))).toEqual({ scanned: 1, sent: 1 });
    expect(prisma.job.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { remindedEveFor: START } }));
    expect((axios.post as jest.Mock).mock.calls[0][1]).toMatchObject({ kind: 'EVE', audience: 'both' });
  });
  it('the sweep hands the claim back when comms fails, so the next sweep tries again', async () => {
    (axios.post as jest.Mock).mockRejectedValue(new Error('down'));
    const { svc, prisma } = make(jobRow());
    expect((await svc.sweep(at('2026-10-11T13:00:00Z'))).sent).toBe(0);
    expect(prisma.job.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({ data: { remindedEveFor: null } }));
  });
});
