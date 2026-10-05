import type { AiProviderName, AiUsage } from './types';

/**
 * List prices in USD per million tokens, used to estimate spend for budgets.
 * Estimates, not invoices: check the provider's price page when they change.
 * Matched by model-name prefix, longest first, so "gpt-4o-mini" wins over "gpt-4o".
 */
type Price = { provider: AiProviderName; prefix: string; input: number; output: number };

const PRICES: Price[] = ([
  { provider: 'openai', prefix: 'gpt-4o-mini', input: 0.15, output: 0.6 },
  { provider: 'openai', prefix: 'gpt-4o', input: 2.5, output: 10 },
  { provider: 'openai', prefix: 'gpt-4.1-mini', input: 0.4, output: 1.6 },
  { provider: 'openai', prefix: 'gpt-4.1', input: 2, output: 8 },
  { provider: 'gemini', prefix: 'gemini-', input: 0.3, output: 2.5 }, // Flash-class default
] as Price[]).sort((a, b) => b.prefix.length - a.prefix.length);

/** Estimated cost of one call in USD, or null when the model or token counts are unknown. */
export function estimateCostUsd(provider: AiProviderName, model: string, usage?: AiUsage): number | null {
  if (!usage || (usage.inputTokens === undefined && usage.outputTokens === undefined)) return null;
  const price = PRICES.find((p) => p.provider === provider && model.startsWith(p.prefix));
  if (!price) return null;
  const cost = ((usage.inputTokens ?? 0) * price.input + (usage.outputTokens ?? 0) * price.output) / 1_000_000;
  return Math.round(cost * 1e6) / 1e6;
}
