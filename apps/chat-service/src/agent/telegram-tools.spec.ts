import { TELEGRAM_TOOLS } from './tools/telegram-tools';
import { ToolRefusal, type AgentContext } from './types';

const ctx: AgentContext = { companyId: 'co', userId: 'u', role: 'dispatcher', email: 'e', timezone: 'UTC', token: 'jwt' };
const tool = (n: string) => TELEGRAM_TOOLS.find((t) => t.name === n)!;

function http(routes: Record<string, any>) {
  const calls: Array<{ key: string; x?: any }> = [];
  const h = (m: string) => async (s: string, p: string, x?: any) => {
    const key = `${m} ${s} ${p}`;
    calls.push({ key, x });
    const v = routes[key];
    if (v === undefined) throw new Error('nf');
    return typeof v === 'function' ? v(x) : v;
  };
  return { client: { get: h('GET'), post: h('POST') } as any, calls };
}
const live = { connected: true, enabled: true, bot: { username: 'OrrixBot', link: 'https://t.me/OrrixBot' }, linked: { customers: 2, staff: 1 } };

describe('telegram_status', () => {
  it('says when no bot is connected', async () => {
    expect(await tool('telegram_status').run({}, ctx, http({ 'GET comms /telegram/settings': { connected: false } }).client)).toMatchObject({ connected: false });
  });
  it('reports the bot, counts, and one customer', async () => {
    const h = http({ 'GET comms /telegram/settings': live, 'GET comms /telegram/links': [{ telegramName: '@ann', linkedAt: 'x' }] });
    expect(await tool('telegram_status').run({ customerId: 'c1' }, ctx, h.client)).toMatchObject({
      connected: true, bot: '@OrrixBot', linkedCustomers: 2, linkedTechnicians: 1, customer: { linked: true, telegram: '@ann' },
    });
  });
});

describe('invite_to_telegram', () => {
  it('refuses until a bot is connected', async () => {
    await expect(tool('invite_to_telegram').preview!({ allCustomers: true }, ctx, http({ 'GET comms /telegram/settings': { connected: false } }).client)).rejects.toBeInstanceOf(ToolRefusal);
  });
  it('previews named customers, skipping those without email, then sends', async () => {
    const h = http({
      'GET comms /telegram/settings': live,
      'GET crm /customers/c1': { id: 'c1', firstName: 'Ann', lastName: 'Lee', email: 'ann@x.com' },
      'GET crm /customers/c2': { id: 'c2', firstName: 'Bo', lastName: '', email: null },
      'POST comms /telegram/invites': { sent: 1, alreadyLinked: 0, noEmail: 0, failed: 0 },
    });
    const p = await tool('invite_to_telegram').preview!({ customerIds: ['c1', 'c2'] }, ctx, h.client);
    expect(p.title).toBe('Invite Ann Lee to Telegram');
    expect(p.lines).toContain('No email on file, so skipped: Bo.');
    const r: any = await tool('invite_to_telegram').run(p.args!, ctx, h.client);
    expect(h.calls.find((c) => c.key === 'POST comms /telegram/invites')!.x).toMatchObject({ customerIds: ['c1'], allCustomers: false });
    expect(r.summary).toBe('1 invite emailed');
  });
});
