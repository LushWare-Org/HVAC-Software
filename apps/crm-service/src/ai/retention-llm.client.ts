import { Injectable, Logger } from '@nestjs/common';
import type { RetentionCustomerProfile, RetentionLlmRecommendation } from '@tscrm/types';
import { RETENTION_LLM_SYSTEM_PROMPT, buildRetentionLlmUserPrompt } from './retention-llm.prompt';
import type { AiGateway } from '@tscrm/ai';
import { PrismaService } from '../prisma/prisma.service';
import { createCrmAiGateway } from './ai-gateway.factory';
import { ModelLedger, geminiThenOpenAi } from './ai-routes';

const VALID_CHANNELS = new Set(['whatsapp', 'email', 'call']);
const VALID_PRIORITIES = new Set(['Low', 'Medium', 'High']);
const VALID_ACTIONS = new Set([
  'premium_contract_offer',
  'discount_retention_offer',
  'maintenance_plan_offer',
  'no_action',
]);
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
export class RetentionLlmClient {
  private readonly logger = new Logger(RetentionLlmClient.name);
  private readonly gateway: AiGateway;
  private readonly ledger = new ModelLedger();

  constructor(prisma: PrismaService) {
    this.gateway = createCrmAiGateway(prisma, this.logger);
  }

  async recommend(profile: RetentionCustomerProfile, companyId?: string): Promise<RetentionLlmRecommendation | null> {
    const res = await this.gateway.generateJson({
      task: 'retention',
      companyId,
      system: RETENTION_LLM_SYSTEM_PROMPT,
      prompt: buildRetentionLlmUserPrompt(profile),
      temperature: 0.4,
      timeoutMs: REQUEST_TIMEOUT_MS,
      routes: geminiThenOpenAi('GEMINI_MODEL_RETENTION'),
      validate: (v): v is RetentionLlmRecommendation => this.isValidRecommendation(v),
    });
    if (!res) return null;
    this.ledger.note(res.data, `${res.provider}/${res.model}`);
    return res.data;
  }

  /** Which model wrote a recommendation this client returned, e.g. "gemini/gemini-3.8-flash". */
  modelUsed(rec: RetentionLlmRecommendation | null): string | null {
    return this.ledger.of(rec);
  }

  private isValidRecommendation(value: unknown): value is RetentionLlmRecommendation {
    if (!value || typeof value !== 'object') return false;
    const rec = value as Record<string, unknown>;

    return (
      typeof rec.strategy === 'string' &&
      rec.strategy.length > 0 &&
      typeof rec.action === 'string' &&
      VALID_ACTIONS.has(rec.action) &&
      typeof rec.channel === 'string' &&
      VALID_CHANNELS.has(rec.channel) &&
      typeof rec.priority === 'string' &&
      VALID_PRIORITIES.has(rec.priority) &&
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
