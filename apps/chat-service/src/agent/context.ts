import type { Request } from 'express';
import type { AuthUser } from '@tscrm/types';
import type { BotType } from '../prompts/prompt.service';
import type { AgentContext } from './types';

/** Who is asking, from the verified JWT. The bot comes from the role, never from the client. */
export function agentContext(user: AuthUser, req: Request): { botType: BotType; ctx: AgentContext } {
  const botType: BotType = user.role === 'customer' ? 'customer' : 'admin';
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  return {
    botType,
    ctx: {
      companyId: user.companyId,
      customerId: user.customerId,
      userId: user.userId,
      role: String(user.role),
      email: user.email ?? '',
      name: (user as { name?: string }).name,
      token,
    },
  };
}
