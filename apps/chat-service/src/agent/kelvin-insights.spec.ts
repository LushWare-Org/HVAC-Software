import { INSIGHT_TOOLS } from './tools/kelvin-insights';
import { AGENT_TOOLS } from './registry';
import type { AgentContext } from './types';

const ctx: AgentContext = { companyId: 'co', userId: 'u', role: 'office_manager', email: 'e', timezone: 'UTC', token: 'jwt' };
const tool = (n: string) => INSIGHT_TOOLS.find((t) => t.name === n)!;
const http = (routes: Record<string, any>) => ({
  get: jest.fn(async (s: string, p: string) => {
    const v = routes[`${s} ${p}`];
    if (v === undefined) throw Object.assign(new Error('nf'), { response: { status: 404, data: { message: 'Not found' } } });
    return v;
  }),
}) as any;

describe('Kelvin uses the existing AI', () => {
  it('get_suggestions: the AI recommendations, most important first, trimmed', async () => {
    const recs = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, title: `T${i}`, reason: 'why', description: 'long text', priority: i < 2 ? 'high' : 'low', priorityScore: 10 - i, actionLabel: 'Open', explanation: { big: true } }));
    const out: any = await tool('get_suggestions').run({}, ctx, http({ 'analytics /recommendations': recs }));
    expect(out.suggestions).toHaveLength(8);
    expect(out.suggestions[0]).toEqual({ title: 'T0', why: 'why', priority: 'high', whatToDo: 'Open' });
  });

  it("customer_health: churn risk, failure risk and the next step, in plain fields", async () => {
    const summary = {
      churnPrediction: { level: 'High', probability: 0.72, summary: 'No visit in 9 months.' },
      failurePrediction: { level: 'Low', probability: 0.1, summary: 'Unit is young.' },
      upsellRecommendation: { recommendedOffer: 'Maintenance plan', reason: 'Two repairs this year.', confidence: 0.8 },
      revenueRisk: 1200, proposedNextStep: 'Call them this week.',
    };
    const out: any = await tool('customer_health').run({ customerId: 'c-1' }, ctx, http({ 'crm /customers/c-1/status-summary': summary }));
    expect(out).toEqual({
      likelyToLeave: 'High (72%): No visit in 9 months.', equipmentFailureRisk: 'Low (10%): Unit is young.',
      upsell: 'Maintenance plan: Two repairs this year.', revenueAtRisk: 1200, nextStep: 'Call them this week.',
    });
  });

  it('low_stock_items: what is below its reorder point and how many to order', async () => {
    const out: any = await tool('low_stock_items').run({}, ctx, http({ 'inventory /alerts/low-stock': [{ itemName: 'Filter', sku: 'F1', currentQty: 2, reorderPoint: 10, reorderQty: 24 }] }));
    expect(out).toEqual({ low: [{ item: 'Filter', sku: 'F1', left: 2, reorderPoint: 10, suggestedOrder: 24 }] });
    expect(await tool('low_stock_items').run({}, ctx, http({ 'inventory /alerts/low-stock': [] }))).toEqual({ low: [], note: 'Nothing is below its reorder point.' });
  });

  it('are registered for Kelvin, read only, with money suggestions for money roles', () => {
    for (const t of INSIGHT_TOOLS) { expect(AGENT_TOOLS).toContain(t); expect(t.kind).toBe('read'); expect(t.kelvinOnly).toBe(true); }
    expect(tool('get_suggestions').roles).not.toContain('dispatcher');
    expect(tool('customer_health').roles).toContain('dispatcher');
  });
});
