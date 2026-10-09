import axios from 'axios';
import { ScheduleNoticeService, scheduleChangeKind } from './schedule-notice.service';

jest.mock('axios');
beforeAll(() => { process.env.SCHEDULE_NOTICE_DELAY_SECONDS = '0'; });

const d = (s: string) => new Date(s);
const NINE = d('2026-10-12T09:00:00Z');
const TEN = d('2026-10-12T10:00:00Z');

describe('scheduleChangeKind', () => {
  const now = { start: NINE, techId: 't1', status: 'SCHEDULED' };
  it('announces a first booking', () => {
    expect(scheduleChangeKind(now, { start: null, techId: null })).toBe('SCHEDULED');
  });
  it('says nothing when the customer already knows', () => {
    expect(scheduleChangeKind(now, { start: NINE, techId: 't1' })).toBeNull();
  });
  it('names what changed', () => {
    expect(scheduleChangeKind(now, { start: TEN, techId: 't1' })).toBe('TIME_CHANGED');
    expect(scheduleChangeKind(now, { start: NINE, techId: 't0' })).toBe('TECH_CHANGED');
    expect(scheduleChangeKind(now, { start: TEN, techId: 't0' })).toBe('TIME_AND_TECH_CHANGED');
  });
  it('waits until there is a technician, a time and the SCHEDULED status', () => {
    expect(scheduleChangeKind({ ...now, techId: null }, { start: null, techId: null })).toBeNull();
    expect(scheduleChangeKind({ ...now, start: null }, { start: null, techId: null })).toBeNull();
    expect(scheduleChangeKind({ ...now, status: 'PENDING' }, { start: null, techId: null })).toBeNull();
    expect(scheduleChangeKind({ ...now, status: 'EN_ROUTE' }, { start: TEN, techId: 't0' })).toBeNull();
  });
});

describe('ScheduleNoticeService.announce', () => {
  const job = (over: Record<string, unknown> = {}) => ({
    id: 'j1', companyId: 'c1', status: 'SCHEDULED', customerId: 'cu1', customerName: 'Hana', customerEmail: 'h@x.lk',
    title: 'AC repair', jobNumber: 'JOB-1', serviceAddress: '1 Main St', assignedToId: 't1', assignedToName: 'Silva',
    scheduledStart: NINE, scheduledEnd: TEN, timeMode: 'EXACT', windowStart: null, windowEnd: null,
    notifiedStart: null, notifiedTechId: null, ...over,
  });
  const make = (j: any, claimed = 1) => {
    const prisma: any = { job: { findFirst: jest.fn().mockResolvedValue(j), updateMany: jest.fn().mockResolvedValue({ count: claimed }) } };
    return { prisma, svc: new ScheduleNoticeService(prisma) };
  };
  beforeEach(() => { (axios.post as jest.Mock).mockReset().mockResolvedValue({}); });

  it('sends once for a new booking and records what the customer was told', async () => {
    const { prisma, svc } = make(job());
    expect(await svc.announce('c1', 'j1')).toEqual({ sent: true, change: 'SCHEDULED' });
    expect((axios.post as jest.Mock).mock.calls[0][1]).toMatchObject({ change: 'SCHEDULED', technicianName: 'Silva', customerEmail: 'h@x.lk' });
    expect(prisma.job.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ notifiedStart: NINE, notifiedTechId: 't1', noticeDueAt: null }) }));
  });

  it('sends nothing when another trigger already claimed the change', async () => {
    const { svc } = make(job(), 0);
    expect((await svc.announce('c1', 'j1')).sent).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('passes the customer\'s window along for a window booking', async () => {
    const { svc } = make(job({ timeMode: 'WINDOW', windowStart: NINE, windowEnd: TEN }));
    await svc.announce('c1', 'j1');
    expect((axios.post as jest.Mock).mock.calls[0][1]).toMatchObject({ windowStart: NINE.toISOString(), windowEnd: TEN.toISOString() });
  });

  it('hands the claim back when comms is down, so the next trigger retries', async () => {
    (axios.post as jest.Mock).mockRejectedValue(new Error('down'));
    const { prisma, svc } = make(job());
    expect((await svc.announce('c1', 'j1')).sent).toBe(false);
    expect(prisma.job.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({ data: { notifiedStart: null, notifiedTechId: null } }));
  });

  it('forgets what it told the customer once the technician is removed', async () => {
    const { prisma, svc } = make(job({ assignedToId: null, notifiedStart: NINE, notifiedTechId: 't1' }));
    await svc.announce('c1', 'j1');
    expect(axios.post).not.toHaveBeenCalled();
    expect(prisma.job.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { notifiedStart: null, notifiedTechId: null } }));
  });
});

describe('ScheduleNoticeService waiting before telling the customer', () => {
  const NOW = new Date('2026-10-12T09:00:00Z');
  const row = (over: Record<string, unknown> = {}) => ({
    id: 'j1', companyId: 'c1', status: 'SCHEDULED', customerId: 'cu1', customerName: 'Hana', customerEmail: 'h@x.lk', title: 'AC',
    assignedToId: 't1', assignedToName: 'Silva', scheduledStart: NOW, scheduledEnd: NOW, timeMode: 'EXACT', notifiedStart: null, notifiedTechId: null, noticeDueAt: null, ...over,
  });
  beforeEach(() => { process.env.SCHEDULE_NOTICE_DELAY_SECONDS = '120'; (axios.post as jest.Mock).mockReset().mockResolvedValue({}); });
  afterAll(() => { process.env.SCHEDULE_NOTICE_DELAY_SECONDS = '0'; });

  it('queues the message instead of sending it, and pushes it later on every change', async () => {
    const prisma: any = { job: { findFirst: jest.fn().mockResolvedValue(row()), updateMany: jest.fn().mockResolvedValue({ count: 1 }) } };
    const svc = new ScheduleNoticeService(prisma);
    const res = await svc.announce('c1', 'j1');
    expect(res).toMatchObject({ sent: false, queued: true, change: 'SCHEDULED' });
    expect(axios.post).not.toHaveBeenCalled();
    const due = prisma.job.updateMany.mock.calls[0][0].data.noticeDueAt as Date;
    expect(due.getTime()).toBeGreaterThan(Date.now() + 100_000);
  });

  it('sends what is due once the quiet period is over', async () => {
    const prisma: any = { job: {
      findMany: jest.fn().mockResolvedValue([{ id: 'j1', companyId: 'c1' }]),
      findFirst: jest.fn().mockResolvedValue(row()),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    } };
    const svc = new ScheduleNoticeService(prisma);
    expect(await svc.sendDue()).toBe(1);
    expect((axios.post as jest.Mock).mock.calls[0][1]).toMatchObject({ change: 'SCHEDULED', technicianUserId: 't1' });
  });
});
