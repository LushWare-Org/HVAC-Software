import { createHmac, randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import type { AgentContext } from './types';

const AUDIENCE = 'ai-action';
const TTL_SECONDS = 10 * 60;

export interface PendingAction {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  title: string;
  lines: string[];
}

interface Claims extends PendingAction {
  sub: string;
  cid: string;
}

/**
 * Its own key, derived from JWT_SECRET, so an action token can never be used
 * as a sign-in token or the other way round.
 */
function key(): Buffer {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return createHmac('sha256', secret).update('ai-action-v1').digest();
}

/**
 * A proposed change, signed so the browser can hold it until the person
 * confirms. Bound to that user and company and valid for 10 minutes; nothing
 * is stored server-side, so it works across every chat-service instance.
 */
export function signAction(action: Omit<PendingAction, 'id'>, ctx: Pick<AgentContext, 'userId' | 'companyId'>): { token: string; id: string } {
  const id = randomUUID();
  const claims: Claims = { ...action, id, sub: ctx.userId, cid: ctx.companyId };
  const token = jwt.sign(claims, key(), { algorithm: 'HS256', audience: AUDIENCE, expiresIn: TTL_SECONDS });
  return { token, id };
}

export class ActionTokenError extends Error {}

/** The action, if the token is genuine, unexpired and was issued to this same user and company. */
export function verifyAction(token: string, ctx: Pick<AgentContext, 'userId' | 'companyId'>): PendingAction {
  let claims: Claims;
  try {
    claims = jwt.verify(token, key(), { algorithms: ['HS256'], audience: AUDIENCE }) as Claims;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw new ActionTokenError('This confirmation expired. Ask again and confirm within 10 minutes.');
    throw new ActionTokenError('This confirmation is not valid.');
  }
  if (claims.sub !== ctx.userId || claims.cid !== ctx.companyId) throw new ActionTokenError('This confirmation belongs to someone else.');
  return { id: claims.id, tool: claims.tool, args: claims.args, title: claims.title, lines: claims.lines };
}
