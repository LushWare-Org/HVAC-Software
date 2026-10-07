/**
 * Plans: several actions confirmed on one card. Each step is an existing action;
 * a later step can use what an earlier one creates ("@1.customerId"). Every step
 * is checked before the card is shown, checked again just before it runs, and
 * runs as the person, so each service applies its own rules. A plan stops at the
 * first failure; what already ran stays done and is listed for undo.
 */
import { signAction } from '../action-token';
import { findTool } from '../registry';
import { serviceErrorMessage, type ServiceHttp } from '../service-http';
import { ToolRefusal, type ActionPreview, type AgentContext, type AgentTool, type PlanScope, type ReverseStep } from '../types';
import type { BotType } from '../../prompts/prompt.service';
import { dependents, isRef, PlanError, refsIn, resolveArgs } from './refs';

export const MAX_STEPS = 25;
export const PLAN_TOOL = 'propose_plan';
const UNDO_MS = 10 * 60 * 1000;

/** label: what a bulk step is about ("JOB-0412"), for the note when it is left out. */
export interface PlanInput { summary?: string; steps: Array<{ tool: string; args?: Record<string, unknown>; label?: string }> }
/** input: what was asked (re-checked just before running); args: what the preview prepared. */
export interface PlanStep { tool: string; args: Record<string, unknown>; input?: Record<string, unknown>; dependsOn: number[]; title: string; sends?: string }
/** What is signed into the card. internal: an undo plan, allowed to use undo-only tools. */
export interface PlanArgs { steps: PlanStep[]; internal?: boolean }
export interface StepCard { n: number; title: string; lines: string[]; sends?: string; dependsOn: number[] }
export interface StepOutcome { n: number; title: string; status: 'done' | 'failed' | 'skipped' | 'not_run'; message?: string }
export interface UndoOffer { token: string; id: string; title: string; lines: string[]; expiresAt: string }
export interface PlanOutcome { ok: boolean; message: string; steps: StepOutcome[]; undo?: UndoOffer; cantUnsend: string[]; summary: string }

function stepTool(name: string, bot: BotType, ctx: AgentContext, internal: boolean): AgentTool {
  const tool = name === PLAN_TOOL ? undefined : findTool(name, bot, ctx.role, { internal });
  if (!tool || tool.kind !== 'write' || !tool.preview) throw new ToolRefusal(`"${name}" isn't something I can do for you here.`);
  return tool;
}

const reason = (err: unknown) => (err instanceof ToolRefusal || err instanceof PlanError ? err.message : serviceErrorMessage(err));

/**
 * internal: an undo plan. lenient: a bulk plan of independent steps; a step that
 * won't work is left out with its reason (in notes) instead of refusing the card,
 * and the steps are checked a few at a time.
 */
export async function previewPlan(input: PlanInput, ctx: AgentContext, http: ServiceHttp, bot: BotType, opts: { internal?: boolean; lenient?: boolean } = {}) {
  const internal = opts.internal === true;
  const raw = Array.isArray(input?.steps) ? input.steps : [];
  if (!raw.length) throw new ToolRefusal('A plan needs at least one step.');
  if (raw.length > MAX_STEPS) throw new ToolRefusal(`A plan can have at most ${MAX_STEPS} steps. Split it up.`);
  if (raw.filter((s) => s.tool === 'create_customer').length > 1) throw new ToolRefusal('A plan can create only one new customer.');
  if (opts.lenient) return previewBulk(input, raw, ctx, http, bot, internal);

  const provided: Array<Record<string, unknown> | undefined> = [];
  const scope: PlanScope = {
    pending(ref) {
      if (!isRef(ref)) return undefined;
      const [step, field] = ref.slice(1).split('.');
      const rec = provided[Number(step) - 1];
      // "@2.quoteId" only works if step 2 really provides a quoteId.
      if (!rec || (field && rec[field] === undefined)) return undefined;
      return rec;
    },
  };
  const cards: StepCard[] = [];
  const steps: PlanStep[] = [];
  for (let i = 0; i < raw.length; i++) {
    const n = i + 1;
    const args = (raw[i].args ?? {}) as Record<string, unknown>;
    try {
      const deps = refsIn(args);
      if (deps.some((d) => d >= n || d < 1)) throw new ToolRefusal('it refers to a step that comes after it.');
      const tool = stepTool(raw[i].tool, bot, ctx, internal);
      const preview = await tool.preview!(args, ctx, http, scope);
      const finalArgs = (preview.args ?? args) as Record<string, unknown>;
      provided[i] = tool.provides?.(finalArgs, preview);
      const sends = tool.sends?.(finalArgs) ?? undefined;
      cards.push({ n, title: preview.title, lines: preview.lines, ...(sends && { sends }), dependsOn: deps });
      steps.push({ tool: tool.name, args: finalArgs, input: args, dependsOn: deps, title: preview.title, ...(sends && { sends }) });
    } catch (err) {
      throw new ToolRefusal(`Step ${n}: ${reason(err)}`);
    }
  }
  return planCard(input, cards, steps, [], internal);
}

function planCard(input: PlanInput, cards: StepCard[], steps: PlanStep[], notes: string[], internal: boolean) {
  const title = input.summary?.trim() || (cards.length === 1 ? cards[0].title : `${cards.length} steps`);
  return {
    title,
    lines: cards.map((c) => `${c.n}. ${c.title}${c.sends ? ' (✉)' : ''}`),
    steps: cards,
    notes,
    args: { steps, ...(internal && { internal: true }) } as PlanArgs,
  };
}

const BATCH = 5;

async function previewBulk(input: PlanInput, raw: PlanInput['steps'], ctx: AgentContext, http: ServiceHttp, bot: BotType, internal: boolean) {
  if (raw.some((s) => refsIn(s.args ?? {}).length)) throw new ToolRefusal('Steps in a bulk change cannot refer to each other.');
  const checked: Array<{ tool: AgentTool; preview: ActionPreview; args: Record<string, unknown> } | { left: string }> = [];
  for (let i = 0; i < raw.length; i += BATCH) {
    checked.push(...await Promise.all(raw.slice(i, i + BATCH).map(async (s) => {
      const args = (s.args ?? {}) as Record<string, unknown>;
      try {
        const tool = stepTool(s.tool, bot, ctx, internal);
        return { tool, preview: await tool.preview!(args, ctx, http), args };
      } catch (err) {
        return { left: `${s.label ?? s.tool}: ${reason(err)}` };
      }
    })));
  }
  const notes = checked.flatMap((c) => ('left' in c ? [`Left out ${c.left}`] : []));
  const cards: StepCard[] = [];
  const steps: PlanStep[] = [];
  for (const c of checked) {
    if ('left' in c) continue;
    const finalArgs = (c.preview.args ?? c.args) as Record<string, unknown>;
    const sends = c.tool.sends?.(finalArgs) ?? undefined;
    cards.push({ n: cards.length + 1, title: c.preview.title, lines: c.preview.lines, ...(sends && { sends }), dependsOn: [] });
    steps.push({ tool: c.tool.name, args: finalArgs, input: c.args, dependsOn: [], title: c.preview.title, ...(sends && { sends }) });
  }
  if (!cards.length) throw new ToolRefusal(`None of these can be done: ${notes.map((n) => n.replace(/^Left out /, '')).join('; ')}`);
  return planCard(input, cards, steps, notes, internal);
}

/** A signed undo pass for what just ran: the reverse steps, newest first, valid 10 minutes. */
export function undoOffer(reverses: ReverseStep[], ctx: AgentContext): UndoOffer | undefined {
  if (!reverses.length) return undefined;
  const title = reverses.length === 1 ? reverses[0].title : `Undo ${reverses.length} changes`;
  const lines = reverses.map((r) => r.title);
  const undoArgs: PlanArgs = { steps: reverses.map((r) => ({ tool: r.tool, args: r.args, dependsOn: [], title: r.title })), internal: true };
  const { token, id } = signAction({ tool: PLAN_TOOL, args: undoArgs as unknown as Record<string, unknown>, title, lines }, ctx);
  return { token, id, title, lines, expiresAt: new Date(Date.now() + UNDO_MS).toISOString() };
}

/** Runs the ticked steps in order. skip: step numbers the person unticked (their dependents are skipped too). */
export async function runPlan(args: PlanArgs, ctx: AgentContext, http: ServiceHttp, bot: BotType, skip: number[] = []): Promise<PlanOutcome> {
  const steps = Array.isArray(args?.steps) ? args.steps : [];
  const skipped = dependents(steps, skip);
  const results: Array<Record<string, unknown> | undefined> = [];
  const outcomes: StepOutcome[] = [];
  const reverses: ReverseStep[] = [];
  const cantUnsend: string[] = [];
  let failed = false;

  for (let i = 0; i < steps.length; i++) {
    const n = i + 1;
    const step = steps[i];
    if (failed) { outcomes.push({ n, title: step.title, status: 'not_run' }); continue; }
    if (skipped.has(n)) { outcomes.push({ n, title: step.title, status: 'skipped' }); continue; }
    try {
      const tool = stepTool(step.tool, bot, ctx, args.internal === true);
      const real = resolveArgs(step.input ?? step.args, results);
      // Check again just before running: things may have changed since the card was shown.
      const recheck = await tool.preview!(real, ctx, http);
      const runArgs = (recheck.args ?? real) as Record<string, unknown>;
      // Money and times must match what the person saw; a changed price or time is refused, not run.
      if (tool.signature) {
        const before = JSON.stringify(tool.signature(resolveArgs(step.args, results)));
        const now = JSON.stringify(tool.signature(runArgs));
        if (before !== now) throw new ToolRefusal(`${step.title} changed since you saw the card (prices, tax or times). Ask me again for an up-to-date card.`);
      }
      const result: any = (await tool.run(runArgs, ctx, http)) ?? {};
      results[i] = typeof result === 'object' ? result : {};
      outcomes.push({ n, title: step.title, status: 'done', message: typeof result.summary === 'string' ? result.summary : step.title });
      if (step.sends) cantUnsend.push(step.title);
      const back = tool.reverse?.(runArgs, result, ctx);
      if (back) reverses.unshift(back);
    } catch (err) {
      failed = true;
      outcomes.push({ n, title: step.title, status: 'failed', message: reason(err) });
    }
  }

  const done = outcomes.filter((o) => o.status === 'done');
  const summary = done.map((o) => o.message).join('; ');
  const undo = undoOffer(reverses, ctx);
  const failure = outcomes.find((o) => o.status === 'failed');
  const ok = !failed && done.length > 0;
  const message = failure
    ? `${done.length ? `Done: ${summary}. ` : ''}Stopped at step ${failure.n}: ${failure.message}`
    : done.length ? `Done: ${summary}.` : 'Nothing was run.';
  return { ok, message, steps: outcomes, ...(undo && { undo }), cantUnsend, summary };
}
