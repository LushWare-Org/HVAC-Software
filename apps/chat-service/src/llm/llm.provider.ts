import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

export type LlmEvent =
  | { type: 'text'; text: string }
  | { type: 'tool'; call: ToolCall }
  | { type: 'usage'; inputTokens: number; outputTokens: number; provider: 'gemini' | 'openai'; model: string };

type ProviderName = 'gemini' | 'openai';
/** extra: provider data that must go back with the call next turn (Gemini's thought signature). */
export interface ToolCall { id: string; name: string; args: string; extra?: Record<string, unknown> }

/** Gemini's extras mean nothing to OpenAI; a conversation that falls back must not carry them. */
function withoutExtras(messages: ChatCompletionMessageParam[]): ChatCompletionMessageParam[] {
  return messages.map((m: any) => (m.role === 'assistant' && Array.isArray(m.tool_calls) && m.tool_calls.some((t: any) => t.extra_content)
    ? { ...m, tool_calls: m.tool_calls.map(({ extra_content, ...t }: any) => t) }
    : m));
}
interface Route { provider: ProviderName; model: string }

/** Gemini speaks the OpenAI chat format here, so one client serves both. */
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
const DEFAULT_RETRY_WAIT_MS = 4_000;

/**
 * How long to wait before retrying a rate limit: what the provider asked for
 * ("retry in 41s", Retry-After), capped. Live chats keep the cap short
 * (LLM_MAX_RETRY_WAIT_MS, default 8 s); a patient test run can raise it.
 */
function retryWait(err: any): number {
  const cap = Number(process.env.LLM_MAX_RETRY_WAIT_MS) || 8_000;
  const header = Number(err?.headers?.['retry-after'] ?? err?.response?.headers?.['retry-after']);
  const said = /retry in ([\d.]+)\s*s/i.exec(String(err?.message ?? ''));
  const ms = header > 0 ? header * 1000 : said ? Math.round(Number(said[1]) * 1000) : DEFAULT_RETRY_WAIT_MS;
  return Math.min(Math.max(ms, 500), cap);
}

const status = (err: any): number | undefined => err?.status ?? err?.response?.status;
/** Out of credits: retrying the same provider will not help. */
const noCredits = (err: any) => err?.code === 'insufficient_quota' || /insufficient_quota|billing/i.test(String(err?.message ?? ''));
/** A daily allowance used up: waiting seconds will not help, so move on at once. */
const dailyLimit = (err: any) => /PerDay|per day/i.test(String(err?.message ?? '')) || JSON.stringify(err?.error ?? err?.errorDetails ?? '').includes('PerDay');

@Injectable()
export class LLMProvider {
  private readonly logger = new Logger(LLMProvider.name);
  private readonly clients = new Map<ProviderName, OpenAI>();
  /** Models whose daily quota ran out, until when to skip them (checked again after an hour). */
  private readonly spent = new Map<string, number>();
  /** The caller's choice of tier; the actual model depends on the provider that answers. */
  readonly modelHelp = process.env.OPENAI_MODEL_HELP ?? 'gpt-4o-mini';
  readonly modelData = process.env.OPENAI_MODEL_DATA ?? 'gpt-4o';

  /**
   * Models in the order to try them. Gemini first when its key is set (its
   * models from GEMINI_MODEL_CHAT, a comma list), OpenAI as the backup, unless
   * CHAT_LLM_PROVIDER names the one to prefer.
   */
  private routes(model: string): Route[] {
    // Each Gemini model has its own quota: when one's daily allowance is used up, the next one answers.
    const geminiModels = (process.env.GEMINI_MODEL_CHAT || 'gemini-3.8-flash,gemini-3.5-flash-lite').split(',').map((m) => m.trim()).filter(Boolean);
    const gemini: Route[] = process.env.GEMINI_API_KEY ? geminiModels.map((m) => ({ provider: 'gemini' as const, model: m })) : [];
    const openai: Route[] = process.env.OPENAI_API_KEY ? [{ provider: 'openai', model }] : [];
    return process.env.CHAT_LLM_PROVIDER === 'openai' ? [...openai, ...gemini] : [...gemini, ...openai];
  }

  // Built on first use: the SDK throws when a key is empty, which must not stop the service from booting.
  protected makeClient(route: Route): OpenAI {
    let c = this.clients.get(route.provider);
    if (!c) {
      c = route.provider === 'gemini'
        ? new OpenAI({ apiKey: process.env.GEMINI_API_KEY, baseURL: GEMINI_BASE_URL, maxRetries: 0 })
        : new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 });
      this.clients.set(route.provider, c);
    }
    return c;
  }

  protected wait(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

  /**
   * Streams text, then at most one tool call per round (each action gets its
   * own confirmation), then token usage. A provider that fails before saying
   * anything (rate limit, bad key, outage, a request it rejects) gets one retry
   * if it was a rate limit, then the next provider is tried. Once text has gone
   * out, a failure is reported rather than restarted.
   */
  async *stream(model: string, messages: ChatCompletionMessageParam[], tools?: ChatCompletionTool[]): AsyncIterable<LlmEvent> {
    const all = this.routes(model);
    if (!all.length) throw new Error('No AI key is configured (GEMINI_API_KEY or OPENAI_API_KEY).');
    const now = Date.now();
    const routes = all.filter((r) => (this.spent.get(`${r.provider}:${r.model}`) ?? 0) <= now);
    if (!routes.length) routes.push(...all); // everything spent: try anyway, the quota may be back
    let lastError: unknown;
    for (const route of routes) {
      const retries = Math.max(0, Number(process.env.LLM_RATE_RETRIES ?? 1) || 0);
      for (let attempt = 0; attempt <= retries; attempt++) {
        let started = false;
        try {
          for await (const ev of this.once(route, messages, tools)) { started = true; yield ev; }
          return;
        } catch (err) {
          if (started) throw err;
          lastError = err;
          if (status(err) === 429 && dailyLimit(err)) this.spent.set(`${route.provider}:${route.model}`, Date.now() + 60 * 60_000);
          const again = attempt < retries && status(err) === 429 && !noCredits(err) && !dailyLimit(err);
          this.logger.warn(`AI ${route.provider} failed (${status(err) ?? 'network'})${again ? ', retrying' : ''}: ${(err as Error)?.message}`);
          if (!again) break;
          await this.wait(retryWait(err));
        }
      }
    }
    throw lastError;
  }

  private async *once(route: Route, messages: ChatCompletionMessageParam[], tools?: ChatCompletionTool[]): AsyncIterable<LlmEvent> {
    const stream = await this.makeClient(route).chat.completions.create({
      model: route.model,
      messages: route.provider === 'openai' ? withoutExtras(messages) : messages,
      stream: true,
      stream_options: { include_usage: true },
      ...(tools?.length ? {
        tools,
        tool_choice: 'auto' as const,
        // Gemini's OpenAI layer does not take this flag; only the first call is used either way.
        ...(route.provider === 'openai' && { parallel_tool_calls: false }),
      } : {}),
    });

    let call: ToolCall | null = null;
    for await (const chunk of stream as AsyncIterable<any>) {
      if (chunk.usage) {
        yield { type: 'usage', inputTokens: chunk.usage.prompt_tokens ?? 0, outputTokens: chunk.usage.completion_tokens ?? 0, provider: route.provider, model: route.model };
      }
      const delta = chunk.choices?.[0]?.delta;
      if (!delta) continue;
      const tc = delta.tool_calls?.[0];
      if (tc) {
        if ((tc.index ?? 0) > 0) continue; // only the first call counts
        // Gemini may leave the id out; the conversation still needs one.
        if (!call) call = { id: tc.id || `call_${Date.now().toString(36)}`, name: '', args: '' };
        if (tc.function?.name) call.name = tc.function.name;
        // Gemini 3 needs its thought signature back with the call on the next turn, or rejects it (400).
        if (tc.extra_content) call.extra = tc.extra_content;
        if (tc.function?.arguments) call.args += tc.function.arguments;
        continue;
      }
      if (delta.content) yield { type: 'text', text: delta.content };
    }
    if (call) yield { type: 'tool', call };
  }
}
