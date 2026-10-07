import { KelvinMindService } from './kelvin-mind.service';

function fakePrisma() {
  const notes: any[] = [];
  const routines: any[] = [];
  const events: any[] = [];
  let n = 0;
  const match = (row: any, where: any) => Object.entries(where ?? {}).every(([k, v]: [string, any]) => {
    if (k === 'OR') return v.some((w: any) => match(row, w));
    if (v && typeof v === 'object' && 'gte' in v) return row[k] >= v.gte;
    return row[k] === v;
  });
  const table = (rows: any[]) => ({
    findMany: jest.fn(async ({ where }: any) => rows.filter((r) => match(r, where))),
    findFirst: jest.fn(async ({ where }: any) => rows.find((r) => match(r, where)) ?? null),
    count: jest.fn(async ({ where }: any) => rows.filter((r) => match(r, where)).length),
    create: jest.fn(async ({ data }: any) => { const row = { id: `id-${++n}`, createdAt: new Date(), ...data }; rows.push(row); return row; }),
    delete: jest.fn(async ({ where }: any) => { rows.splice(rows.findIndex((r) => r.id === where.id), 1); }),
  });
  return { notes, routines, events, kelvinNote: table(notes), kelvinRoutine: table(routines), kelvinEvent: table(events) };
}

const me = { companyId: 'co', userId: 'u', role: 'dispatcher', name: 'Dee' };
const boss = { companyId: 'co', userId: 'b', role: 'office_manager', name: 'Sam' };

describe('notes', () => {
  it('a person sees company notes and their own, never someone else\'s or another company\'s', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinMindService(prisma as any);
    await svc.addNote(boss, { text: 'Our call-out fee is 2,500.', forEveryone: true });
    await svc.addNote(me, { text: 'I start at 7.' });
    await svc.addNote(boss, { text: 'Sam only.' });
    await svc.addNote({ ...boss, companyId: 'other' }, { text: 'Other company.', forEveryone: true });
    const mine = await svc.notes(me);
    expect(mine.map((x) => [x.text, x.forEveryone])).toEqual([['Our call-out fee is 2,500.', true], ['I start at 7.', false]]);
  });

  it('only admins and office managers add or remove notes for everyone', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinMindService(prisma as any);
    await expect(svc.addNote(me, { text: 'x', forEveryone: true })).rejects.toThrow('office manager');
    const n = await svc.addNote(boss, { text: 'Fee 2,500', forEveryone: true });
    await expect(svc.removeNote(me, n.id)).rejects.toThrow('office manager');
    await svc.removeNote(boss, n.id);
    expect(prisma.notes).toHaveLength(0);
  });

  it('a personal note is removed only by its owner', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinMindService(prisma as any);
    const n = await svc.addNote(me, { text: 'mine' });
    await expect(svc.removeNote(boss, n.id)).rejects.toThrow('not found');
    await svc.removeNote(me, n.id);
    expect(prisma.notes).toHaveLength(0);
  });

  it('keeps notes short and limited in number', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinMindService(prisma as any);
    await expect(svc.addNote(me, { text: '  ' })).rejects.toThrow('What should I remember');
    await expect(svc.addNote(me, { text: 'x'.repeat(301) })).rejects.toThrow('300');
    for (let i = 0; i < 30; i++) await svc.addNote(me, { text: `n${i}` });
    await expect(svc.addNote(me, { text: 'one more' })).rejects.toThrow('30');
  });
});

describe('routines', () => {
  it('saves a routine for this person, checked', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinMindService(prisma as any);
    const r = await svc.addRoutine(me, { request: 'Chase invoices over 30 days overdue', days: [1, 2, 3, 4, 5, 5], time: '08:00', timezone: 'Asia/Colombo' });
    expect(r).toMatchObject({ request: 'Chase invoices over 30 days overdue', days: [1, 2, 3, 4, 5], time: '08:00', timezone: 'Asia/Colombo' });
    expect((await svc.routines(me)).map((x) => x.id)).toEqual([r.id]);
    expect(await svc.routines(boss)).toEqual([]);
    await expect(svc.addRoutine(me, { request: 'x', days: [], time: '08:00' })).rejects.toThrow('which days');
    await expect(svc.addRoutine(me, { request: 'x', days: [1], time: '8am' })).rejects.toThrow('HH:MM');
    await expect(svc.addRoutine(me, { request: 'x', days: [1], time: '08:00', timezone: 'Mars/Base' })).rejects.toThrow('time zone');
  });

  it('removes only your own routine', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinMindService(prisma as any);
    const r = await svc.addRoutine(me, { request: 'x', days: [1], time: '08:00' });
    await expect(svc.removeRoutine(boss, r.id)).rejects.toThrow('not found');
    await svc.removeRoutine(me, r.id);
    expect(prisma.routines).toHaveLength(0);
  });
});

describe('habits', () => {
  it('a step this person unticked 3 or more times lately is a habit', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinMindService(prisma as any);
    const skip = (action: string, userId = 'u') => prisma.events.push({ companyId: 'co', userId, type: 'STEP_SKIPPED', action, createdAt: new Date() });
    ['send_quote', 'send_quote', 'send_quote', 'send_quote', 'message_customer', 'message_customer'].forEach((a) => skip(a));
    skip('send_invoice', 'other'); skip('send_invoice', 'other'); skip('send_invoice', 'other');
    expect(await svc.habits(me)).toEqual({ usuallySkips: [{ action: 'send_quote', times: 4 }] });
  });
});
