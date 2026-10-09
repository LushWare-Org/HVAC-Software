import { CUSTOMER_KELVIN_TOOLS } from './tools/customer-kelvin';
import { AGENT_TOOLS } from './registry';
import type { AgentContext } from './types';

const ctx: AgentContext = { companyId: 'co', userId: 'u', role: 'customer', customerId: 'c-1', name: 'Sara Perera', email: 's@x', timezone: 'UTC', token: 'jwt' };
const tool = (n: string) => CUSTOMER_KELVIN_TOOLS.find((t) => t.name === n)!;
function http(routes: Record<string, any>) {
  const calls: Array<{ key: string; body?: any }> = [];
  const h = (m: string) => async (s: string, p: string, x?: any) => {
    const key = `${m} ${s} ${p}`;
    calls.push({ key, body: x });
    const v = routes[key];
    if (v === undefined) throw Object.assign(new Error('nf'), { response: { status: 404, data: { message: 'Not found' } } });
    return typeof v === 'function' ? v(x) : v;
  };
  return { client: { get: h('GET'), post: h('POST'), patch: h('PATCH') } as any, calls };
}
const job = (extra: Record<string, unknown> = {}) => ({ id: 'j-1', jobNumber: 'JOB-0412', title: 'AC not cooling', customerId: 'c-1', status: 'SCHEDULED', scheduledStart: '2026-10-13T03:30:00Z', assignedToName: 'Kasun Fernando', assignedToId: 'u-k', ...extra });

describe('note_for_technician', () => {
  it('shows the note and adds it to the visit', async () => {
    const h = http({ 'GET jobs /jobs/j-1': job(), 'POST jobs /jobs/j-1/customer-note': {} });
    const p = await tool('note_for_technician').preview!({ jobId: 'j-1', note: 'Gate code is 1234' }, ctx, h.client);
    expect(p).toMatchObject({ title: 'Note for Kasun on JOB-0412', lines: ['"Gate code is 1234"', 'Kasun sees it with the visit details.'] });
    await tool('note_for_technician').run(p.args!, ctx, h.client);
    expect(h.calls.at(-1)).toEqual({ key: 'POST jobs /jobs/j-1/customer-note', body: { note: 'Gate code is 1234' } });
  });

  it('refuses a visit that already happened', async () => {
    await expect(tool('note_for_technician').preview!({ jobId: 'j-1', note: 'x' }, ctx, http({ 'GET jobs /jobs/j-1': job({ status: 'COMPLETED' }) }).client)).rejects.toThrow('already happened');
  });
});

describe('update_my_details', () => {
  const me = { phone: '0771234567', mobile: null, address: '12 Galle Rd', city: 'Colombo', email: 's@x' };
  it('shows old to new, and only sends what changes', async () => {
    const h = http({ 'GET crm /customers/me': me, 'PATCH crm /customers/me': {} });
    const p = await tool('update_my_details').preview!({ phone: '0779999999', city: 'Colombo' }, ctx, h.client);
    expect(p.lines).toEqual(['Phone: 0771234567 → 0779999999']);
    await tool('update_my_details').run(p.args!, ctx, h.client);
    expect(h.calls.at(-1)!.body).toEqual({ phone: '0779999999' });
  });

  it('says plainly that email is changed elsewhere, and needs a change', async () => {
    await expect(tool('update_my_details').preview!({ email: 'new@x' }, ctx, http({ 'GET crm /customers/me': me }).client)).rejects.toThrow('sign-in');
    await expect(tool('update_my_details').preview!({ city: 'Colombo' }, ctx, http({ 'GET crm /customers/me': me }).client)).rejects.toThrow('already');
  });
});

describe('ask_to_cancel', () => {
  it('asks the office to cancel, without cancelling', async () => {
    const h = http({ 'GET jobs /jobs/j-1': job(), 'POST comms /chat/office/messages': { conversationId: 'cv-1' } });
    const p = await tool('ask_to_cancel').preview!({ jobId: 'j-1', reason: 'Fixed itself' }, ctx, h.client);
    expect(p.title).toBe('Ask to cancel JOB-0412');
    expect(p.lines).toContain('The office confirms the cancellation with you. Nothing is cancelled yet.');
    await tool('ask_to_cancel').run(p.args!, ctx, h.client);
    expect(h.calls.find((c) => c.key === 'POST comms /chat/office/messages')!.body).toMatchObject({ jobId: 'j-1' });
    expect(h.calls.at(-1)!.body.body).toMatch(/^Please cancel my visit JOB-0412 \(AC not cooling, .+\)\. Reason: Fixed itself$/);
    expect(h.calls.some((c) => c.key.startsWith('PATCH'))).toBe(false);
  });

  it('refuses once the technician is on the way', async () => {
    await expect(tool('ask_to_cancel').preview!({ jobId: 'j-1' }, ctx, http({ 'GET jobs /jobs/j-1': job({ status: 'EN_ROUTE' }) }).client)).rejects.toThrow('on the way');
  });
});

describe('leave_review', () => {
  it('reviews a finished visit with its technician', async () => {
    const h = http({ 'GET jobs /jobs/j-1': job({ status: 'COMPLETED' }), 'POST crm /reviews': { id: 'r-1' } });
    const p = await tool('leave_review').preview!({ jobId: 'j-1', rating: 5, comment: 'Quick and tidy' }, ctx, h.client);
    expect(p).toMatchObject({ title: 'Review JOB-0412', lines: ['★★★★★ (5 of 5)', '"Quick and tidy"', 'For Kasun Fernando'] });
    await tool('leave_review').run(p.args!, ctx, h.client);
    expect(h.calls.at(-1)!.body).toEqual({ type: 'JOB', rating: 5, comment: 'Quick and tidy', jobId: 'j-1', technicianId: 'u-k', technicianName: 'Kasun Fernando', source: 'assistant' });
  });

  it('a company review without a visit; ratings must be 1 to 5; unfinished visits refused', async () => {
    const p = await tool('leave_review').preview!({ rating: 4 }, ctx, http({}).client);
    expect(p).toMatchObject({ title: 'Review the company', args: { type: 'COMPANY', rating: 4 } });
    await expect(tool('leave_review').preview!({ rating: 6 }, ctx, http({}).client)).rejects.toThrow('1 to 5');
    await expect(tool('leave_review').preview!({ jobId: 'j-1', rating: 5 }, ctx, http({ 'GET jobs /jobs/j-1': job() }).client)).rejects.toThrow('after the visit');
  });
});

it('are customer tools, for Kelvin companies only', () => {
  for (const t of CUSTOMER_KELVIN_TOOLS) {
    expect(AGENT_TOOLS).toContain(t);
    expect(t.bots).toEqual(['customer']);
    expect(t.roles).toEqual(['customer']);
    expect(t.kelvinOnly).toBe(true);
  }
});
