/**
 * The AI that was already in the product, as lookups Kelvin can use in a
 * conversation: the recommendations, each customer's health, and low stock.
 */
import type { AgentTool } from '../types';

const OFFICE = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];
const MONEY = ['super_admin', 'company_admin', 'office_manager'];
const list = (res: any): any[] => (Array.isArray(res) ? res : res?.data ?? []);
const pct = (p: unknown) => `${Math.round((Number(p) || 0) * 100)}%`;
const risk = (r: any) => (r?.level ? `${r.level} (${pct(r.probability)})${r.summary ? `: ${r.summary}` : ''}` : null);

export const INSIGHT_TOOLS: AgentTool[] = [
  {
    name: 'get_suggestions',
    description: "The business suggestions Kelvin works out from the company's data (who to win back, slow payers, quiet weeks to fill), most important first.",
    parameters: { type: 'object', properties: {} },
    kind: 'read',
    bots: ['admin'],
    roles: MONEY,
    kelvinOnly: true,
    run: async (_args, _ctx, http) => {
      const recs = list(await http.get('analytics', '/recommendations'))
        .sort((a, b) => Number(b.priorityScore ?? 0) - Number(a.priorityScore ?? 0))
        .slice(0, 8);
      return { suggestions: recs.map((r) => ({ title: r.title, why: r.reason, priority: r.priority, whatToDo: r.actionLabel })) };
    },
  },
  {
    name: 'customer_health',
    description: "How a customer is doing: how likely they are to leave, their equipment's failure risk, an upsell idea and the suggested next step.",
    parameters: { type: 'object', properties: { customerId: { type: 'string' } }, required: ['customerId'] },
    kind: 'read',
    bots: ['admin'],
    roles: OFFICE,
    kelvinOnly: true,
    run: async (args, _ctx, http) => {
      const s = await http.get('crm', `/customers/${encodeURIComponent(String(args.customerId))}/status-summary`);
      const up = s?.upsellRecommendation;
      return {
        likelyToLeave: risk(s?.churnPrediction),
        equipmentFailureRisk: risk(s?.failurePrediction),
        upsell: up?.recommendedOffer ? `${up.recommendedOffer}${up.reason ? `: ${up.reason}` : ''}` : null,
        revenueAtRisk: Number(s?.revenueRisk) || 0,
        nextStep: s?.proposedNextStep ?? null,
      };
    },
  },
  {
    name: 'low_stock_items',
    description: 'Stock items below their reorder point in the warehouse, worst first, with how many to reorder.',
    parameters: { type: 'object', properties: {} },
    kind: 'read',
    bots: ['admin'],
    roles: OFFICE,
    kelvinOnly: true,
    run: async (_args, _ctx, http) => {
      const low = list(await http.get('inventory', '/alerts/low-stock')).slice(0, 20)
        .map((i) => ({ item: i.itemName, sku: i.sku, left: Number(i.currentQty) || 0, reorderPoint: i.reorderPoint, suggestedOrder: i.reorderQty }));
      return low.length ? { low } : { low, note: 'Nothing is below its reorder point.' };
    },
  },
];
