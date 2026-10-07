/**
 * References between plan steps. A string argument "@2.jobId" means "the jobId
 * step 2 produced"; "@2" alone means step 2's main id. Steps are numbered from 1.
 */

/** A plan problem the person should see as-is. */
export class PlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanError';
  }
}

const REF = /^@(\d+)(?:\.(\w+))?$/;

export function isRef(v: unknown): v is string {
  return typeof v === 'string' && REF.test(v);
}

function walk(v: unknown, f: (s: string) => unknown): unknown {
  if (typeof v === 'string') return f(v);
  if (Array.isArray(v)) return v.map((x) => walk(x, f));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, f)]));
  return v;
}

/** The step numbers an argument tree refers to. */
export function refsIn(args: unknown): number[] {
  const out = new Set<number>();
  walk(args, (s) => {
    const m = s.match(REF);
    if (m) out.add(Number(m[1]));
    return s;
  });
  return [...out];
}

/** Replaces references with what earlier steps produced. results[i] is step i+1's result. */
export function resolveArgs(args: Record<string, unknown>, results: Array<Record<string, unknown> | undefined>): Record<string, any> {
  return walk(args, (s) => {
    const m = s.match(REF);
    if (!m) return s;
    const step = Number(m[1]);
    const result = results[step - 1];
    if (!result) throw new PlanError(`Step ${step} has not run, so its result can't be used.`);
    const field = m[2] ?? 'id';
    if (result[field] === undefined) throw new PlanError(`Step ${step} has no ${field}.`);
    return result[field];
  }) as Record<string, any>;
}

/** The skipped steps plus every step that depends on one of them, directly or not. */
export function dependents(steps: Array<{ dependsOn: number[] }>, skipped: number[]): Set<number> {
  const out = new Set<number>(skipped);
  let grew = true;
  while (grew) {
    grew = false;
    steps.forEach((s, i) => {
      const n = i + 1;
      if (!out.has(n) && s.dependsOn.some((d) => out.has(d))) {
        out.add(n);
        grew = true;
      }
    });
  }
  return out;
}
