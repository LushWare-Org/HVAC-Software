import { Injectable, Logger } from '@nestjs/common';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { createAiGuard, createQueueUsageRecorder, estimateCostUsd } from '@tscrm/ai';
import { createRedisConnection } from '@tscrm/queue';
import { isFeatureEnabled } from '@tscrm/types';
import { LLMProvider } from '../llm/llm.provider';
import { PromptService, BotType } from '../prompts/prompt.service';
import { signAction } from '../agent/action-token';
import { toolsFor, toOpenAiTools } from '../agent/registry';
import { ServiceHttp, serviceErrorMessage } from '../agent/service-http';
import { ToolRefusal, type AgentContext, type AgentTool } from '../agent/types';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatTurn[];
}

export type ChatEvent =
  | { type: 'chunk'; text: string }
  | { type: 'status'; text: string }
  | { type: 'action'; action: { token: string; id: string; title: string; lines: string[] } };

/** Tool rounds per message, so a confused model cannot loop forever. */
const MAX_ROUNDS = 6;
/** Tool output handed back to the model, at most. */
const MAX_TOOL_CHARS = 12_000;

const human = (name: string) => name.replace(/^(get|find|list)_/, '').replace(/_/g, ' ');

/** "+04:00" for a zone at a moment. */
export function utcOffset(timeZone: string, at = new Date()): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(at).find((p) => p.type === 'timeZoneName')?.value ?? '';
    const m = part.match(/GMT([+-]\d{2}:\d{2})/);
    return m ? m[1] : '+00:00';
  } catch {
    return '+00:00';
  }
}

/** The part of the system prompt that changes every request: the clock, and how to act. */
export function contextPrompt(ctx: AgentContext, tools: AgentTool[], now = new Date()): string {
  const tz = ctx.timezone || 'UTC';
  let local: string;
  try {
    local = now.toLocaleString('en-GB', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    local = now.toISOString();
  }
  const offset = utcOffset(tz, now);
  const parts = [
    `## Right now\nIt is ${local} in ${tz} (UTC${offset}). Send every time to a tool as ISO 8601 with that offset, e.g. ${now.toISOString().slice(0, 10)}T09:00:00${offset}.`,
  ];
  const actions = tools.filter((t) => t.kind === 'write').map((t) => t.name);
  if (actions.length) {
    parts.push(
      `## Taking actions\nYou can make changes with: ${actions.join(', ')}.\n` +
      '- Find the record first with the lookup tools. Never guess an id.\n' +
      '- When the person asks for a change, call the action tool straight away. The card it shows IS the confirmation, so do not ask "shall I proceed?" in text first.\n' +
      '- Calling an action changes nothing yet. Say in one short sentence what you prepared and that it happens when they press Confirm. Never say it is done.\n' +
      '- A later message saying an action was confirmed or cancelled is the outcome; trust it.\n' +
      '- If an action is refused, pass the reason on plainly and suggest what to do instead.\n' +
      '- One action per message. If they ask for several, prepare the first and offer the next.',
    );
  }
  return parts.join('\n\n');
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  // Monthly budget block; the switch itself comes from settings below. Bounded lookups, so a Redis outage never stalls chat.
  private readonly budgetGuard = process.env.REDIS_URL ? createAiGuard({ redis: createRedisConnection() }) : null;
  private readonly recordUsage = process.env.REDIS_URL ? createQueueUsageRecorder('chat-service', { logger: this.logger }) : null;

  constructor(
    private readonly llm: LLMProvider,
    private readonly prompts: PromptService,
  ) {}

  /** Company time zone and feature switches, read as the person. Never blocks the chat. */
  private async settings(http: ServiceHttp): Promise<{ timezone?: string; features?: unknown }> {
    try {
      return await http.get('crm', '/company/settings');
    } catch {
      return {};
    }
  }

  async *streamResponse(req: ChatRequest, botType: BotType, ctx: AgentContext): AsyncIterable<ChatEvent> {
    const http = new ServiceHttp(ctx);
    const settings = await this.settings(http);
    ctx.timezone = settings.timezone ?? ctx.timezone;

    if (!isFeatureEnabled(settings.features, 'ai')) {
      yield { type: 'chunk', text: 'The AI assistant is switched off for your company. An admin can turn it back on in settings.' };
      return;
    }
    const decision = this.budgetGuard ? await this.budgetGuard({ task: 'chat', companyId: ctx.companyId }) : { allowed: true as const };
    if (!decision.allowed) {
      yield { type: 'chunk', text: `The AI assistant is paused. ${decision.reason}` };
      return;
    }

    const tools = toolsFor(botType, ctx.role);
    const model = this.llm.modelData;
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: `${this.prompts.forBot(botType)}\n\n${contextPrompt(ctx, tools)}` },
      ...req.history.slice(-10).map((t) => ({ role: t.role, content: t.content }) as ChatCompletionMessageParam),
      { role: 'user', content: req.message },
    ];

    const started = Date.now();
    const usage = { inputTokens: 0, outputTokens: 0 };
    let ok = true;
    try {
      for (let round = 0; round < MAX_ROUNDS; round++) {
        let text = '';
        let call: { id: string; name: string; args: string } | null = null;
        for await (const ev of this.llm.stream(model, messages, toOpenAiTools(tools))) {
          if (ev.type === 'text') { text += ev.text; yield { type: 'chunk', text: ev.text }; }
          else if (ev.type === 'tool') call = ev.call;
          else { usage.inputTokens += ev.inputTokens; usage.outputTokens += ev.outputTokens; }
        }
        if (!call) return;

        messages.push({
          role: 'assistant',
          content: text || null,
          tool_calls: [{ id: call.id, type: 'function', function: { name: call.name, arguments: call.args || '{}' } }],
        });
        const result = yield* this.runTool(call, tools, ctx, http);
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result).slice(0, MAX_TOOL_CHARS) });
      }
      yield { type: 'chunk', text: '\n\nThat took too many steps. Try asking for one thing at a time.' };
    } catch (err) {
      ok = false;
      throw err;
    } finally {
      this.recordUsage?.({
        at: new Date().toISOString(), task: `chat-${botType}`, companyId: ctx.companyId, ok,
        provider: 'openai', model, attempts: 1, latencyMs: Date.now() - started, usage,
        costUsd: estimateCostUsd('openai', model, usage) ?? undefined,
      });
    }
  }

  /** Runs a read tool, or turns a write tool into a confirmation card. Returns what the model sees. */
  private async *runTool(
    call: { name: string; args: string },
    tools: AgentTool[],
    ctx: AgentContext,
    http: ServiceHttp,
  ): AsyncGenerator<ChatEvent, unknown> {
    const tool = tools.find((t) => t.name === call.name);
    if (!tool) return { error: `${call.name} is not available to you.` };

    let args: Record<string, any>;
    try {
      args = JSON.parse(call.args || '{}');
    } catch {
      return { error: 'The arguments were not valid JSON.' };
    }

    try {
      if (tool.kind === 'read') {
        yield { type: 'status', text: `Looking up ${human(tool.name)}…` };
        return await tool.run(args, ctx, http);
      }

      yield { type: 'status', text: `Preparing ${human(tool.name)}…` };
      const preview = await tool.preview!(args, ctx, http);
      const { token, id } = signAction({ tool: tool.name, args: preview.args ?? args, title: preview.title, lines: preview.lines }, ctx);
      yield { type: 'action', action: { token, id, title: preview.title, lines: preview.lines } };
      return {
        status: 'awaiting_confirmation',
        shownToPerson: { title: preview.title, details: preview.lines },
        note: 'Nothing has changed yet. The person will press Confirm or Cancel on the card.',
      };
    } catch (err) {
      if (err instanceof ToolRefusal) return { refused: err.message };
      this.logger.warn(`Tool ${tool.name} failed: ${(err as Error).message}`);
      return { error: serviceErrorMessage(err) };
    }
  }
}
