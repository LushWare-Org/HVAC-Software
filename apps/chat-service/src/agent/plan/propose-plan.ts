import type { AgentTool } from '../types';
import { previewPlan, runPlan, type PlanArgs } from './plan';

const OFFICE = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];

/**
 * Several changes on one card. Each step is one of the other action tools with
 * its arguments; a later step can use what an earlier step creates with
 * "@N.field", e.g. customerId "@1.customerId". Steps are checked before the card
 * is shown; money steps still need a money role.
 */
export const PROPOSE_PLAN: AgentTool = {
  name: 'propose_plan',
  description:
    'Prepare several changes as one card the person confirms once: e.g. create a customer, then a job for them, then a quote. ' +
    'Each step is { tool, args } using the other action tools. Refer to what an earlier step creates with "@N.customerId", ' +
    '"@N.jobId", "@N.quoteId" or "@N.invoiceId" (N counts from 1). Use it whenever a request needs more than one change. ' +
    'At most 25 steps and one new customer.',
  parameters: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'One short line for the card, e.g. "New customer R&R Brothers, emergency job with Kasun".' },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: { tool: { type: 'string' }, args: { type: 'object' } },
          required: ['tool', 'args'],
        },
      },
    },
    required: ['steps'],
  },
  kind: 'write',
  bots: ['admin'],
  roles: OFFICE,
  kelvinOnly: true,
  preview: async (args, ctx, http) => {
    const p = await previewPlan({ summary: args.summary, steps: args.steps }, ctx, http, 'admin');
    return { title: p.title, lines: p.lines, args: p.args as unknown as Record<string, unknown>, steps: p.steps };
  },
  run: async (args, ctx, http) => runPlan(args as unknown as PlanArgs, ctx, http, 'admin'),
};
