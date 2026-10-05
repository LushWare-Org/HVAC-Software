export type AiProviderName = 'gemini' | 'openai';

/** One model to try, in order. A task lists several so a busy provider falls through to the next. */
export interface ModelRoute {
  provider: AiProviderName;
  model: string;
}

export interface AiImage {
  mimeType: string;
  /** Raw base64, no data: prefix. */
  base64: string;
}

export interface AiUsage {
  inputTokens?: number;
  outputTokens?: number;
}

/** What a provider adapter is asked to do: one attempt, one model, JSON back. */
export interface ProviderCall {
  model: string;
  system: string;
  prompt: string;
  images?: AiImage[];
  temperature?: number;
  timeoutMs: number;
}

export interface ProviderResult {
  text: string;
  usage?: AiUsage;
}

export interface ProviderAdapter {
  readonly name: AiProviderName;
  /** False when the provider has no API key, so routes using it are skipped. */
  isConfigured(): boolean;
  generate(call: ProviderCall): Promise<ProviderResult>;
}

export interface GenerateJsonRequest<T> {
  /** Short stable name, used for routing overrides and logs: 'upsell', 'insights', 'equipment-scan'. */
  task: string;
  /** Tenant the call is for, recorded with the usage. */
  companyId?: string;
  system: string;
  prompt: string;
  images?: AiImage[];
  temperature?: number;
  /** Models to try in order. AI_ROUTE_<TASK> in the environment overrides this. */
  routes: ModelRoute[];
  /** Shape check. A response that fails it counts as a failure and the next model is tried. */
  validate: (value: unknown) => value is T;
  /** Per attempt. Clamped to at least 10s, the minimum Gemini accepts. Default 20s. */
  timeoutMs?: number;
}

export interface GenerateJsonResult<T> {
  data: T;
  provider: AiProviderName;
  model: string;
  attempts: number;
  latencyMs: number;
  usage?: AiUsage;
}

export interface AiLogger {
  log(message: string): void;
  warn(message: string): void;
}
