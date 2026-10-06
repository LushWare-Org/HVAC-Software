import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import type { BotType } from '../prompts/prompt.service';
import type { AgentTool } from './types';
import { READ_TOOLS } from './tools/read-tools';
import { WRITE_TOOLS } from './tools/write-tools';
import { CUSTOMER_TOOLS } from './tools/customer-tools';
import { FIND_OPEN_TIMES } from './tools/open-times';
import { DISRUPTION_TOOLS } from './tools/disruption-tools';

export const AGENT_TOOLS: AgentTool[] = [...READ_TOOLS, FIND_OPEN_TIMES, ...WRITE_TOOLS, ...DISRUPTION_TOOLS, ...CUSTOMER_TOOLS];

/** Tools this person may use: right bot, and their role is allowed. */
export function toolsFor(bot: BotType, role: string): AgentTool[] {
  const r = role.toLowerCase();
  return AGENT_TOOLS.filter((t) => t.bots.includes(bot) && (!t.roles || t.roles.includes(r)));
}

export function findTool(name: string, bot: BotType, role: string): AgentTool | undefined {
  return toolsFor(bot, role).find((t) => t.name === name);
}

export function toOpenAiTools(tools: AgentTool[]): ChatCompletionTool[] {
  return tools.map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.parameters as unknown as Record<string, unknown> },
  }));
}
