import { KelvinLogService } from './kelvin-log.service';

function fakePrisma() {
  const events: any[] = [];
  let prefs: any = null;
  return {
    events,
    kelvinEvent: {
      create: jest.fn(async ({ data }) => { events.push({ ...data, createdAt: new Date() }); return data; }),
      findMany: jest.fn(async ({ where }) => events.filter((e) =>
        e.companyId === where.companyId && e.userId === where.userId &&
        (!where.itemId || where.itemId.in.includes(e.itemId)) &&
        (!where.type || (where.type.in ?? [where.type]).includes(e.type)))),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
    kelvinPrefs: {
      findUnique: jest.fn(async () => prefs),
      upsert: jest.fn(async ({ create, update }) => { prefs = { ...(prefs ?? create), ...update }; return prefs; }),
    },
  };
}

describe('KelvinLogService', () => {
  it('records an event and trims the summary to 300 characters', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinLogService(prisma as any);
    await svc.record({ companyId: 'co', userId: 'u', type: 'SPOKE', itemId: 'gap:1', summary: 'x'.repeat(500) });
    expect(prisma.events[0]).toMatchObject({ companyId: 'co', userId: 'u', type: 'SPOKE', itemId: 'gap:1' });
    expect(prisma.events[0].summary).toHaveLength(300);
  });

  it('ignores unknown event types and events without a company or user', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinLogService(prisma as any);
    await svc.record({ companyId: 'co', userId: 'u', type: 'HACKED' as any, summary: 'x' });
    await svc.record({ companyId: '', userId: 'u', type: 'SPOKE', summary: 'x' });
    expect(prisma.events).toHaveLength(0);
  });

  it('reports which items this person was told, saw or dismissed', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinLogService(prisma as any);
    await svc.record({ companyId: 'co', userId: 'u', type: 'SPOKE', itemId: 'a', summary: 's' });
    await svc.record({ companyId: 'co', userId: 'u', type: 'DISMISSED', itemId: 'b', summary: 's' });
    await svc.record({ companyId: 'co', userId: 'other', type: 'SPOKE', itemId: 'c', summary: 's' });
    const state = await svc.state('co', 'u', ['a', 'b', 'c']);
    expect(state).toEqual({ spoken: ['a'], seen: [], dismissed: ['b'] });
  });

  it('caps a state lookup at 200 ids', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinLogService(prisma as any);
    await svc.state('co', 'u', Array.from({ length: 500 }, (_, i) => `i${i}`));
    expect(prisma.kelvinEvent.findMany.mock.calls[0][0].where.itemId.in).toHaveLength(200);
  });

  it('defaults preferences and validates the mode', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinLogService(prisma as any);
    expect(await svc.prefs('co', 'u')).toEqual({ speakMode: 'ALL', quietUntil: null, tone: 'FRIENDLY' });
    await expect(svc.setPrefs('co', 'u', { speakMode: 'LOUD' as any })).rejects.toThrow('speakMode');
    const saved = await svc.setPrefs('co', 'u', { speakMode: 'URGENT_ONLY', quietUntil: '2026-10-06T18:30:00.000Z' });
    expect(saved).toEqual({ speakMode: 'URGENT_ONLY', quietUntil: '2026-10-06T18:30:00.000Z', tone: 'FRIENDLY' });
    await expect(svc.setPrefs('co', 'u', { tone: 'SHOUTY' as any })).rejects.toThrow('tone');
    expect((await svc.setPrefs('co', 'u', { tone: 'SHORT' })).tone).toBe('SHORT');
  });
});
