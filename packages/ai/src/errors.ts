/** Thrown by an adapter when its own deadline passes. */
export class AiTimeoutError extends Error {
  constructor(ms: number) {
    super(`timed out after ${ms}ms`);
    this.name = 'AiTimeoutError';
  }
}

/** HTTP-ish status of a provider error, read from the SDK error or the JSON body it carries. */
export function errorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const e = err as { status?: unknown; code?: unknown; message?: unknown };
  if (typeof e.status === 'number') return e.status;
  if (typeof e.code === 'number') return e.code;
  // @google/genai puts the API's JSON error in the message: {"error":{"code":503,...}}
  if (typeof e.message === 'string') {
    const m = e.message.match(/"code"\s*:\s*(\d{3})/);
    if (m) return Number(m[1]);
  }
  return undefined;
}

/**
 * Worth trying the same model again: rate limits, server errors, timeouts and
 * dropped connections. Bad requests, auth failures and unknown models are not,
 * so those move straight on to the next model.
 */
export function isRetryable(err: unknown): boolean {
  if (err instanceof AiTimeoutError) return true;
  const status = errorStatus(err);
  if (status !== undefined) return status === 408 || status === 429 || status >= 500;
  const msg = err instanceof Error ? err.message : String(err);
  return /timeout|timed out|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|fetch failed|network/i.test(msg);
}

/** One short line for logs: "503 This model is currently experiencing high demand". */
export function describeError(err: unknown): string {
  const status = errorStatus(err);
  let msg = err instanceof Error ? err.message : String(err);
  const inner = msg.match(/"message"\s*:\s*"([^"]+)"/);
  if (inner) msg = inner[1];
  msg = msg.replace(/\s+/g, ' ').slice(0, 160);
  return status ? `${status} ${msg}` : msg;
}
