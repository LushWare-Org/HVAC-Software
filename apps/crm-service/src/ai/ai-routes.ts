import type { ModelRoute } from '@tscrm/ai';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
export const DEFAULT_OPENAI_FALLBACK = 'gpt-4o-mini';

/**
 * Gemini first (the task's own model setting), then OpenAI as the backup, so a
 * busy Gemini no longer drops the whole feature back to its non-AI path.
 * AI_ROUTE_<TASK> still overrides both at runtime.
 */
export function geminiThenOpenAi(geminiModelEnv: string): ModelRoute[] {
  return [
    { provider: 'gemini', model: process.env[geminiModelEnv] || DEFAULT_GEMINI_MODEL },
    { provider: 'openai', model: process.env.OPENAI_MODEL_FALLBACK || DEFAULT_OPENAI_FALLBACK },
  ];
}

/** Remembers which model produced a result, without changing the result's shape. */
export class ModelLedger {
  private readonly byResult = new WeakMap<object, string>();

  note(result: object, label: string): void {
    this.byResult.set(result, label);
  }

  of(result: object | null | undefined): string | null {
    return result ? this.byResult.get(result) ?? null : null;
  }
}
