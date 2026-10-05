import { Injectable, Logger } from '@nestjs/common';
import { AiGateway } from '@tscrm/ai';
import type { RevenueCustomerProfile, RevenueLlmRecommendation } from '@tscrm/types';
import { REVENUE_LLM_SYSTEM_PROMPT, buildRevenueLlmUserPrompt } from './revenue-llm.prompt';
import { ModelLedger, geminiThenOpenAi } from './ai-routes';

const VALID_CHANNELS = new Set(['whatsapp', 'email', 'call']);
const VALID_PRIORITIES = new Set(['Low', 'Medium', 'High']);
const MAX_MESSAGE_LENGTH = 320;
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
export class RevenueLlmClient {
  private readonly logger = new Logger(RevenueLlmClient.name);
  private readonly gateway = new AiGateway({ logger: this.logger });
  private readonly ledger = new ModelLedger();

  async recommend(profile: RevenueCustomerProfile, companyId?: string): Promise<RevenueLlmRecommendation | null> {
    const res = await this.gateway.generateJson({
      task: 'revenue',
      companyId,
      system: REVENUE_LLM_SYSTEM_PROMPT,
      prompt: buildRevenueLlmUserPrompt(profile),
      temperature: 0.4,
      timeoutMs: REQUEST_TIMEOUT_MS,
      routes: geminiThenOpenAi('GEMINI_MODEL_REVENUE'),
      validate: (v): v is RevenueLlmRecommendation => this.isValidRecommendation(v),
    });
    if (!res) return null;
    this.ledger.note(res.data, `${res.provider}/${res.model}`);
    return res.data;
  }

  /** Which model wrote a recommendation this client returned, e.g. "gemini/gemini-3.8-flash". */
  modelUsed(rec: RevenueLlmRecommendation | null): string | null {
    return this.ledger.of(rec);
  }

  private isValidRecommendation(value: unknown): value is RevenueLlmRecommendation {
    if (!value || typeof value !== 'object') return false;
    const rec = value as Record<string, unknown>;

    return (
      typeof rec.strategy === 'string' &&
      rec.strategy.length > 0 &&
      typeof rec.recommendedAction === 'string' &&
      rec.recommendedAction.length > 0 &&
      typeof rec.priority === 'string' &&
      VALID_PRIORITIES.has(rec.priority) &&
      typeof rec.expectedImpact === 'string' &&
      rec.expectedImpact.length > 0 &&
      typeof rec.channel === 'string' &&
      VALID_CHANNELS.has(rec.channel) &&
      typeof rec.reason === 'string' &&
      rec.reason.length > 0 &&
      typeof rec.message === 'string' &&
      rec.message.length > 0 &&
      rec.message.length <= MAX_MESSAGE_LENGTH &&
      typeof rec.confidence === 'number' &&
      rec.confidence >= 0 &&
      rec.confidence <= 1
    );
  }
}
