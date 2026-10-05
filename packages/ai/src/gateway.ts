import { describeError, isRetryable } from './errors';
import type { AiGuard } from './guard';
import { estimateCostUsd } from './pricing';
import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';
import type {
  AiLogger, AiProviderName, AiUsage, GenerateJsonRequest, GenerateJsonResult, ModelRoute, ProviderAdapter,
} from './types';

/** One finished call, for usage tracking. Emitted whether it succeeded or not. */
export interface AiCallRecord {
  /** ISO time the call finished. */
  at: string;
  task: string;
  companyId?: string;
  ok: boolean;
  provider?: AiProviderName;
  model?: string;
  attempts: number;
  latencyMs: number;
  usage?: AiUsage;
  /** Estimated USD, when the model's price and token counts are known. */
  costUsd?: number;
  /** Set when the guard stopped the call before any model was asked. */
  skipped?: string;
  /** Short reason when every model failed. */
  error?: string;
}

export interface AiGatewayOptions {
  providers?: ProviderAdapter[];
  logger?: AiLogger;
  env?: NodeJS.ProcessEnv;
  /** Tries per model before moving on, when the error is worth retrying. Default 2. */
  maxAttemptsPerModel?: number;
  /** Pause before a retry, multiplied by the attempt number. Default 750ms. */
  backoffMs?: number;
  defaultTimeoutMs?: number;
  onCall?: (record: AiCallRecord) => void;
  /** Asked before any model is called: company switch, monthly budget. */
  guard?: AiGuard;
  sleep?: (ms: number) => Promise<void>;
}

const consoleLogger: AiLogger = { log: (m) => console.log(m), warn: (m) => console.warn(m) };

/**
 * The one way services ask a model for structured output.
 *
 * Tries each route in order. A busy or slow model is retried, then the next
 * route takes over, so one provider having a bad hour does not switch AI off.
 * Returns null only when every route failed; callers keep their non-AI
 * fallback for that case.
 */
export class AiGateway {
  private readonly providers = new Map<AiProviderName, ProviderAdapter>();
  private readonly logger: AiLogger;
  private readonly env: NodeJS.ProcessEnv;
  private readonly maxAttempts: number;
  private readonly backoffMs: number;
  private readonly defaultTimeoutMs: number;
  private readonly onCall?: (record: AiCallRecord) => void;
  private readonly guard?: AiGuard;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(opts: AiGatewayOptions = {}) {
    this.env = opts.env ?? process.env;
    for (const p of opts.providers ?? [new GeminiProvider(this.env), new OpenAIProvider(this.env)]) {
      this.providers.set(p.name, p);
    }
    this.logger = opts.logger ?? consoleLogger;
    this.maxAttempts = Math.max(1, opts.maxAttemptsPerModel ?? 2);
    this.backoffMs = opts.backoffMs ?? 750;
    this.defaultTimeoutMs = opts.defaultTimeoutMs ?? 20_000;
    this.onCall = opts.onCall;
    this.guard = opts.guard;
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  async generateJson<T>(req: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T> | null> {
    const started = Date.now();
    const failures: string[] = [];
    let attempts = 0;

    if (this.guard) {
      let decision: Awaited<ReturnType<AiGuard>> = { allowed: true };
      try { decision = await this.guard({ task: req.task, companyId: req.companyId }); } catch { /* fail open */ }
      if (!decision.allowed) {
        this.logger.log(`[ai] ${req.task} skipped${req.companyId ? ` for company=${req.companyId}` : ''}: ${decision.reason}`);
        this.emit({ task: req.task, companyId: req.companyId, ok: false, attempts: 0, latencyMs: 0, skipped: decision.reason });
        return null;
      }
    }

    for (const route of this.resolveRoutes(req)) {
      const label = `${route.provider}/${route.model}`;
      const provider = this.providers.get(route.provider);
      if (!provider) { failures.push(`${label}: unknown provider`); continue; }
      if (!provider.isConfigured()) { failures.push(`${label}: no API key`); continue; }

      for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
        attempts++;
        try {
          const res = await provider.generate({
            model: route.model,
            system: req.system,
            prompt: req.prompt,
            images: req.images,
            temperature: req.temperature,
            timeoutMs: req.timeoutMs ?? this.defaultTimeoutMs,
          });
          const parsed = parseJson(res.text);
          if (parsed === undefined) { failures.push(`${label}: response was not JSON`); break; }
          if (!req.validate(parsed)) { failures.push(`${label}: unexpected response shape`); break; }

          const result: GenerateJsonResult<T> = {
            data: parsed, provider: route.provider, model: route.model,
            attempts, latencyMs: Date.now() - started, usage: res.usage,
          };
          const fellBack = failures.length ? ` after: ${failures.join('; ')}` : '';
          this.logger.log(
            `[ai] ${req.task} ok via ${label} in ${result.latencyMs}ms, attempts=${attempts}` +
            `${res.usage ? `, tokens=${res.usage.inputTokens ?? '?'}/${res.usage.outputTokens ?? '?'}` : ''}` +
            `${req.companyId ? `, company=${req.companyId}` : ''}${fellBack}`,
          );
          const costUsd = estimateCostUsd(route.provider, route.model, res.usage) ?? undefined;
          this.emit({ task: req.task, companyId: req.companyId, ok: true, provider: route.provider, model: route.model, attempts, latencyMs: result.latencyMs, usage: res.usage, costUsd });
          return result;
        } catch (err) {
          failures.push(`${label}: ${describeError(err)}`);
          if (!isRetryable(err) || attempt === this.maxAttempts) break;
          await this.sleep(this.backoffMs * attempt);
        }
      }
    }

    const latencyMs = Date.now() - started;
    this.logger.warn(
      `[ai] ${req.task} failed after ${attempts} attempt(s) in ${latencyMs}ms` +
      `${req.companyId ? `, company=${req.companyId}` : ''}: ${failures.join('; ') || 'no routes'}`,
    );
    this.emit({ task: req.task, companyId: req.companyId, ok: false, attempts, latencyMs, error: (failures.join('; ') || 'no routes').slice(0, 500) });
    return null;
  }

  /**
   * AI_ROUTE_<TASK>=provider:model,provider:model replaces the caller's routes,
   * so a model can be swapped in production without a deploy. Unknown or
   * malformed entries are ignored; if nothing valid is left, the caller's
   * routes are used.
   */
  resolveRoutes(req: Pick<GenerateJsonRequest<unknown>, 'task' | 'routes'>): ModelRoute[] {
    const key = `AI_ROUTE_${req.task.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
    const raw = this.env[key];
    const fromEnv = (raw ?? '')
      .split(',')
      .map((s) => s.trim())
      .map((s) => {
        const i = s.indexOf(':');
        return { provider: s.slice(0, i) as AiProviderName, model: s.slice(i + 1).trim() };
      })
      .filter((r) => (r.provider === 'gemini' || r.provider === 'openai') && r.model);
    const routes = fromEnv.length ? fromEnv : req.routes;
    const seen = new Set<string>();
    return routes.filter((r) => {
      const k = `${r.provider}/${r.model}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  private emit(record: Omit<AiCallRecord, 'at'>) {
    try { this.onCall?.({ at: new Date().toISOString(), ...record }); } catch { /* usage tracking must never break the call */ }
  }
}

/** JSON from a model reply, tolerating ```json fences. undefined when it is not JSON. */
export function parseJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  if (!trimmed) return undefined;
  try { return JSON.parse(trimmed); } catch { return undefined; }
}
