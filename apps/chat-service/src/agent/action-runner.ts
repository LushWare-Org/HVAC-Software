import { Logger } from '@nestjs/common';
import type { BotType } from '../prompts/prompt.service';
import { ActionTokenError, verifyAction } from './action-token';
import { findTool } from './registry';
import { ServiceHttp, serviceErrorMessage } from './service-http';
import { ToolRefusal, type AgentContext } from './types';
import { publishKelvinEvent } from '../kelvin/kelvin-events';

const logger = new Logger('AiActions');

export interface ActionOutcome {
  ok: boolean;
  /** What to show the person, and to tell the model on the next turn. */
  message: string;
  actionId?: string;
}

/**
 * Runs a confirmed action. The token must have been issued to this same
 * person, and their role is checked again now, in case it changed since the
 * card was shown. The call goes to the owning service with the person's own
 * token, so its usual rules, events and activity log all apply.
 */
export async function confirmAction(token: string, ctx: AgentContext, bot: BotType): Promise<ActionOutcome> {
  let action;
  try {
    action = verifyAction(token, ctx);
  } catch (err) {
    if (err instanceof ActionTokenError) return { ok: false, message: err.message };
    throw err;
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
    return { ok: true, message: `Done: ${summary}.`, actionId: action.id };
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
