import { MEMORY_TOOLS, parseDays } from './tools/kelvin-memory';
import { AGENT_TOOLS } from './registry';
import type { AgentContext } from './types';

const ctx = (role = 'dispatcher'): AgentContext => ({ companyId: 'co', userId: 'u', role, email: 'e', timezone: 'Asia/Colombo', token: 'jwt' });
const tool = (n: string) => MEMORY_TOOLS.find((t) => t.name === n)!;

function http(routes: Record<string, any>) {
  const calls: Array<{ key: string; body?: any }> = [];
  const h = (m: string) => async (s: string, p: string, x?: any) => {
    const key = `${m} ${s} ${p}`;
    calls.push({ key, body: x });
    const v = routes[key];
    if (typeof v === 'function') return v(x);
    if (v === undefined) throw Object.assign(new Error('nf'), { response: { status: 404, data: { message: 'Not found' } } });
    return v;
  };
  return { client: { get: h('GET'), post: h('POST'), delete: h('DELETE') } as any, calls };
}

const mind = {
  notes: [{ id: 'n-1', text: 'Our call-out fee is 2,500.', forEveryone: true }, { id: 'n-2', text: 'I start at 7.', forEveryone: false }],
  routines: [{ id: 'r-1', request: 'Chase invoices over 30 days overdue', days: [1, 2, 3, 4, 5], time: '08:00', timezone: 'Asia/Colombo' }],
  habits: { usuallySkips: [] },
};

describe('remember', () => {
  it('shows exactly what will be remembered, and for whom', async () => {
    const p = await tool('remember').preview!({ text: 'R&R Brothers always want Kasun' }, ctx(), http({}).client);
    expect(p).toMatchObject({ title: 'Remember this for you', lines: ['"R&R Brothers always want Kasun"', 'I\'ll keep it in mind in every conversation. Remove it any time from my desk.'] });
    const all = await tool('remember').preview!({ text: 'Call-out fee is 2,500', forEveryone: true }, ctx('office_manager'), http({}).client);
    expect(all.title).toBe('Remember this for everyone');
  });

  it('only admins and office managers remember things for everyone', async () => {
    await expect(tool('remember').preview!({ text: 'x', forEveryone: true }, ctx('dispatcher'), http({}).client)).rejects.toThrow('office manager');
  });

  it('saves it, and undo forgets it', async () => {
    const h = http({ 'POST analytics /kelvin/notes': { id: 'n-9', text: 'x', forEveryone: false } });
    const p = await tool('remember').preview!({ text: 'x' }, ctx(), h.client);
    const r = await tool('remember').run(p.args!, ctx(), h.client);
    expect(h.calls[0].body).toEqual({ text: 'x', forEveryone: false });
    expect(tool('remember').reverse!(p.args!, r, ctx())).toEqual({ tool: 'forget', args: { noteId: 'n-9' }, title: 'Forget "x"' });
  });
});

describe('forget', () => {
  it('finds the note by id or by its words', async () => {
    const h = http({ 'GET analytics /kelvin/mind': mind, 'DELETE analytics /kelvin/notes/n-1': { ok: true } });
    const p = await tool('forget').preview!({ noteId: 'call-out fee' }, ctx('office_manager'), h.client);
    expect(p.title).toBe('Forget "Our call-out fee is 2,500."');
    await tool('forget').run(p.args!, ctx(), h.client);
    expect(h.calls.at(-1)!.key).toBe('DELETE analytics /kelvin/notes/n-1');
    await expect(tool('forget').preview!({ noteId: 'nothing like it' }, ctx(), h.client)).rejects.toThrow('not found');
  });
});

describe('routines', () => {
  it('reads days the way people say them', () => {
    expect(parseDays('weekdays')).toEqual([1, 2, 3, 4, 5]);
    expect(parseDays('every day')).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(parseDays(['Mon', 'friday'])).toEqual([1, 5]);
    expect(parseDays('Tuesday and Thursday')).toEqual([2, 4]);
    expect(parseDays('someday')).toEqual([]);
  });

  it('add_routine shows when it comes up, in company time, and saves it with the zone', async () => {
    const h = http({ 'POST analytics /kelvin/routines': { id: 'r-9', request: 'Chase invoices over 30 days overdue' } });
    const p = await tool('add_routine').preview!({ request: 'Chase invoices over 30 days overdue', days: 'weekdays', time: '08:00' }, ctx(), h.client);
    expect(p.title).toBe('New routine: Chase invoices over 30 days overdue');
    expect(p.lines).toEqual(['Every weekday at 8:00 am', 'At that time I put it on my desk with a Run it button. Nothing changes until you confirm the card.']);
    const r = await tool('add_routine').run(p.args!, ctx(), h.client);
    expect(h.calls[0].body).toEqual({ request: 'Chase invoices over 30 days overdue', days: [1, 2, 3, 4, 5], time: '08:00', timezone: 'Asia/Colombo' });
    expect(tool('add_routine').reverse!(p.args!, r, ctx())).toMatchObject({ tool: 'remove_routine', args: { routineId: 'r-9' } });
  });

  it('refuses unclear days or times', async () => {
    await expect(tool('add_routine').preview!({ request: 'x', days: 'sometimes', time: '08:00' }, ctx(), http({}).client)).rejects.toThrow('days');
    await expect(tool('add_routine').preview!({ request: 'x', days: 'monday', time: '8' }, ctx(), http({}).client)).rejects.toThrow('HH:MM');
  });

  it('remove_routine finds it by words', async () => {
    const h = http({ 'GET analytics /kelvin/mind': mind, 'DELETE analytics /kelvin/routines/r-1': { ok: true } });
    const p = await tool('remove_routine').preview!({ routineId: 'chase invoices' }, ctx(), h.client);
    expect(p.title).toBe('Stop routine: Chase invoices over 30 days overdue');
  });
});

describe('what_you_remember', () => {
  it('lists notes and routines', async () => {
    const out: any = await tool('what_you_remember').run({}, ctx(), http({ 'GET analytics /kelvin/mind': mind }).client);
    expect(out.notes).toHaveLength(2);
    expect(out.routines[0]).toMatchObject({ id: 'r-1', when: 'Every weekday at 8:00 am' });
  });

  it('memory tools are Kelvin only, for office roles', () => {
    for (const t of MEMORY_TOOLS) {
      expect(AGENT_TOOLS).toContain(t);
      expect(t.kelvinOnly).toBe(true);
      expect(t.roles).not.toContain('customer');
    }
  });
});
