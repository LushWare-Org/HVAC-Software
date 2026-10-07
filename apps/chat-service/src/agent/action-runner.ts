import { Logger } from '@nestjs/common';
import type { BotType } from '../prompts/prompt.service';
import { ActionTokenError, verifyAction } from './action-token';
import { findTool } from './registry';
import { ServiceHttp, serviceErrorMessage } from './service-http';
import { ToolRefusal, type AgentContext } from './types';
import { publishKelvinEvent } from '../kelvin/kelvin-events';
import { PLAN_TOOL, runPlan, undoOffer, type PlanArgs, type StepOutcome, type UndoOffer } from './plan/plan';
import { RunOnce } from './plan/run-once';

const logger = new Logger('AiActions');

export interface ActionOutcome {
  ok: boolean;
  /** What to show the person, and to tell the model on the next turn. */
  message: string;
  actionId?: string;
  /** For a plan: what happened to each step. */
  steps?: StepOutcome[];
  /** A signed card that reverses what just ran, valid 10 minutes. */
  undo?: UndoOffer;
  /** Steps that sent something to a customer: these cannot be undone. */
  cantUnsend?: string[];
}

/**
 * Runs a confirmed action. The token must have been issued to this same
 * person, and their role is checked again now, in case it changed since the
 * card was shown. The call goes to the owning service with the person's own
 * token, so its usual rules, events and activity log all apply.
 */
export async function confirmAction(token: string, ctx: AgentContext, bot: BotType, skip: number[] = []): Promise<ActionOutcome> {
  let action;
  try {
    action = verifyAction(token, ctx);
  } catch (err) {
    if (err instanceof ActionTokenError) return { ok: false, message: err.message };
    throw err;
  }

  // A double click, or the same card confirmed in two tabs, runs once.
  const claim = await RunOnce.claim(action.id);
  if (claim === 'unavailable') return { ok: false, message: "I couldn't make sure this runs only once just now. Nothing was changed. Try again in a moment.", actionId: action.id };
  if (!claim) return { ok: false, message: 'Already done.', actionId: action.id };

  if (action.tool === PLAN_TOOL) {
    const out = await runPlan(action.args as unknown as PlanArgs, ctx, new ServiceHttp(ctx, action.id), bot, skip);
    logger.log(`AI plan ${action.id} by ${ctx.userId} (company=${ctx.companyId}): ${out.steps.map((st) => `${st.n}=${st.status}`).join(' ')}`);
    publishKelvinEvent({
      companyId: ctx.companyId, userId: ctx.userId, type: out.ok ? 'ACTION_DONE' : 'ACTION_FAILED', action: PLAN_TOOL,
      summary: out.summary || action.title, confirmedBy: ctx.userId,
    });
    // What the person unticked, so Kelvin learns to leave it out next time.
    const planSteps = (action.args as unknown as PlanArgs).steps ?? [];
    for (const n of new Set(skip)) {
      const st = planSteps[n - 1];
      if (st && !(action.args as unknown as PlanArgs).internal) publishKelvinEvent({ companyId: ctx.companyId, userId: ctx.userId, type: 'STEP_SKIPPED', action: st.tool, summary: st.title });
    }
    return { ok: out.ok, message: out.message, actionId: action.id, steps: out.steps, ...(out.undo && { undo: out.undo }), cantUnsend: out.cantUnsend };
  }

  const tool = findTool(action.tool, bot, ctx.role);
  if (!tool || tool.kind !== 'write') return { ok: false, message: 'You are not allowed to do that.', actionId: action.id };

  try {
    const result: any = await tool.run(action.args, ctx, new ServiceHttp(ctx, action.id));
    const summary: string = typeof result?.summary === 'string' ? result.summary : action.title;
    logger.log(`AI action ${action.id} confirmed: ${action.tool} by ${ctx.userId} (company=${ctx.companyId})`);
    publishKelvinEvent({
      companyId: ctx.companyId, userId: ctx.userId, type: 'ACTION_DONE', action: action.tool,
      summary, recordRef: typeof result?.recordRef === 'string' ? result.recordRef : undefined, confirmedBy: ctx.userId,
    });
    const back = tool.reverse?.(action.args, result, ctx);
    const undo = back ? undoOffer([back], ctx) : undefined;
    const sent = tool.sends?.(action.args);
    return { ok: true, message: `Done: ${summary}.`, actionId: action.id, ...(undo && { undo }), ...(sent && { cantUnsend: [action.title] }) };
  } catch (err) {
    const reason = err instanceof ToolRefusal ? err.message : serviceErrorMessage(err);
    logger.warn(`AI action ${action.id} failed: ${action.tool} by ${ctx.userId}: ${reason}`);
    publishKelvinEvent({
      companyId: ctx.companyId, userId: ctx.userId, type: 'ACTION_FAILED', action: action.tool,
      summary: `${action.title}: ${reason}`, confirmedBy: ctx.userId,
    });
    return { ok: false, message: `Could not ${action.title.charAt(0).toLowerCase()}${action.title.slice(1)}: ${reason}`, actionId: action.id };
  }

}
