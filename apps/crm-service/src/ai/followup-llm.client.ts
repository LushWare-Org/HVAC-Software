import { Injectable, Logger } from '@nestjs/common';
import type { FollowupCustomerProfile, FollowupLlmRecommendation } from '@tscrm/types';
import { FOLLOWUP_LLM_SYSTEM_PROMPT, buildFollowupLlmUserPrompt } from './followup-llm.prompt';
import type { AiGateway } from '@tscrm/ai';
import { PrismaService } from '../prisma/prisma.service';
import { createCrmAiGateway } from './ai-gateway.factory';
import { ModelLedger, geminiThenOpenAi } from './ai-routes';

const VALID_CHANNELS = new Set(['SMS', 'EMAIL']);
const VALID_PRIORITIES = new Set(['Low', 'Medium', 'High']);
/** Background batch work, so a slow model is allowed time; thinking models often pass 12s. */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Writes the copy/offer/channel for a decision the rule engine has already
 * made; never decides whether to act. Goes through the shared AI gateway:
 * Gemini first, OpenAI as the backup, retries on busy or slow responses.
 * Returns null only when every model failed, so the caller falls back to its
 * rule-only path.
 */
@Injectable()
export class FollowupLlmClient {
  private readonly logger = new Logger(FollowupLlmClient.name);
  private readonly gateway: AiGateway;
  private readonly ledger = new ModelLedger();

  constructor(prisma: PrismaService) {
    this.gateway = createCrmAiGateway(prisma, this.logger);
  }

  async recommend(profile: FollowupCustomerProfile, companyId?: string): Promise<FollowupLlmRecommendation | null> {
    const res = await this.gateway.generateJson({
      task: 'followup',
      companyId,
      system: FOLLOWUP_LLM_SYSTEM_PROMPT,
      prompt: buildFollowupLlmUserPrompt(profile),
      temperature: 0.4,
      timeoutMs: REQUEST_TIMEOUT_MS,
      routes: geminiThenOpenAi('GEMINI_MODEL_FOLLOWUP'),
      validate: (v): v is FollowupLlmRecommendation => this.isValidRecommendation(v),
    });
    if (!res) return null;
    this.ledger.note(res.data, `${res.provider}/${res.model}`);
    return res.data;
  }

  /** Which model wrote a recommendation this client returned, e.g. "gemini/gemini-3.8-flash". */
  modelUsed(rec: FollowupLlmRecommendation | null): string | null {
    return this.ledger.of(rec);
  }

  private isValidRecommendation(value: unknown): value is FollowupLlmRecommendation {
    if (!value || typeof value !== 'object') return false;
    const rec = value as Record<string, unknown>;

    return (
      typeof rec.channel === 'string' &&
      VALID_CHANNELS.has(rec.channel) &&
      typeof rec.priority === 'string' &&
      VALID_PRIORITIES.has(rec.priority) &&
      typeof rec.followupWithin === 'string' &&
      rec.followupWithin.length > 0 &&
      typeof rec.reason === 'string' &&
      rec.reason.length > 0 &&
      typeof rec.message === 'string' &&
      rec.message.length > 0 &&
      rec.message.length <= 320 &&
      typeof rec.confidence === 'number' &&
      rec.confidence >= 0 &&
      rec.confidence <= 1
    );
  }
}
