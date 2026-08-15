const SENSITIVE_KEYS = new Set([
  'password', 'token', 'secret', 'cardnumber', 'cvv', 'ssn', 'authorization',
  'accesstoken', 'refreshtoken', 'apikey',
]);

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = isSensitiveKey(key) ? '[REDACTED]' : redactValue(val);
    }
    return out;
  }
  return value;
}

/**
 * Recursively strips sensitive fields (by key name, case-insensitive) from a
 * request/response body before it is ever attached to an ActivityLogEvent.
 * Returns undefined for undefined input. Truncates to maxBytes (default 2KB)
 * so one enormous payload can't bloat the activity log.
 */
export function redact(obj: unknown, maxBytes = 2048): Record<string, unknown> | undefined {
  if (obj === undefined || obj === null) return undefined;
  const cleaned = redactValue(obj);
  const json = JSON.stringify(cleaned);
  if (json.length <= maxBytes) {
    return cleaned as Record<string, unknown>;
  }
  return { truncated: true, preview: json.slice(0, maxBytes) };
}
