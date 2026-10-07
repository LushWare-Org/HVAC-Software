import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import type { BotType } from '../prompts/prompt.service';
import type { AgentTool } from './types';
import { READ_TOOLS } from './tools/read-tools';
import { WRITE_TOOLS } from './tools/write-tools';
import { CUSTOMER_TOOLS } from './tools/customer-tools';
import { FIND_OPEN_TIMES } from './tools/open-times';
import { DISRUPTION_TOOLS } from './tools/disruption-tools';
import { CREATE_JOB } from './tools/create-job';
import { PROPOSE_PLAN } from './plan/propose-plan';
import { CUSTOMER_OFFICE_TOOLS } from './tools/office-customers';
import { QUOTE_TOOLS } from './tools/office-quotes';
import { INVOICE_TOOLS } from './tools/office-invoices';
import { AGREEMENT_TOOLS } from './tools/office-agreements';
import { BULK_TOOLS } from './tools/office-bulk';
import { MEMORY_TOOLS } from './tools/kelvin-memory';
import { USUAL_TECHNICIAN_TOOL } from './tools/usual-tech';
import { INSIGHT_TOOLS } from './tools/kelvin-insights';

export const AGENT_TOOLS: AgentTool[] = [...READ_TOOLS, FIND_OPEN_TIMES, ...WRITE_TOOLS, CREATE_JOB, PROPOSE_PLAN, ...CUSTOMER_OFFICE_TOOLS, ...QUOTE_TOOLS, ...INVOICE_TOOLS, ...AGREEMENT_TOOLS, ...BULK_TOOLS, ...MEMORY_TOOLS, USUAL_TECHNICIAN_TOOL, ...INSIGHT_TOOLS, ...DISRUPTION_TOOLS, ...CUSTOMER_TOOLS];

/** Tools this person may use: right bot, and their role is allowed. */
function allowed(t: AgentTool, bot: BotType, role: string): boolean {
  return t.bots.includes(bot) && (!t.roles || t.roles.includes(role.toLowerCase()));
}

/** Tools this person may use: right bot, and their role is allowed. Internal tools are never offered. */
export function toolsFor(bot: BotType, role: string): AgentTool[] {
  return AGENT_TOOLS.filter((t) => !t.internal && allowed(t, bot, role));
}

/** A tool by name for this person. The plan engine passes { internal: true } to reach undo-only tools. */
export function findTool(name: string, bot: BotType, role: string, opts: { internal?: boolean } = {}): AgentTool | undefined {
  return AGENT_TOOLS.find((t) => t.name === name && allowed(t, bot, role) && (!t.internal || opts.internal));
}

export function toOpenAiTools(tools: AgentTool[]): ChatCompletionTool[] {
  return tools.map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.parameters as unknown as Record<string, unknown> },
  }));
}

/** Drops tools meant only for Kelvin when the company has not switched him on. */
export function withoutKelvinOnly(tools: AgentTool[], features: unknown): AgentTool[] {
  const on = (features as Record<string, unknown> | null | undefined)?.kelvin === true;
  return on ? tools : tools.filter((t) => !t.kelvinOnly);
}
