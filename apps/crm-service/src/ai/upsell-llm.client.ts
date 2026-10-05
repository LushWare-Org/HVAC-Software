import { Injectable, Logger } from '@nestjs/common';
import type { UpsellCustomerProfile, UpsellLlmRecommendation } from '@tscrm/types';
import { UPSELL_LLM_SYSTEM_PROMPT, buildUpsellLlmUserPrompt } from './upsell-llm.prompt';
import type { AiGateway } from '@tscrm/ai';
import { PrismaService } from '../prisma/prisma.service';
import { createCrmAiGateway } from './ai-gateway.factory';
import { ModelLedger, geminiThenOpenAi } from './ai-routes';

const VALID_CHANNELS = new Set(['whatsapp', 'email', 'call']);
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
export class UpsellLlmClient {
  private readonly logger = new Logger(UpsellLlmClient.name);
  private readonly gateway: AiGateway;
  private readonly ledger = new ModelLedger();

  constructor(prisma: PrismaService) {
    this.gateway = createCrmAiGateway(prisma, this.logger);
  }

  async recommend(profile: UpsellCustomerProfile, companyId?: string): Promise<UpsellLlmRecommendation | null> {
    const res = await this.gateway.generateJson({
      task: 'upsell',
      companyId,
      system: UPSELL_LLM_SYSTEM_PROMPT,
      prompt: buildUpsellLlmUserPrompt(profile),
      temperature: 0.4,
      timeoutMs: REQUEST_TIMEOUT_MS,
      routes: geminiThenOpenAi('GEMINI_MODEL_UPSELL'),
      validate: (v): v is UpsellLlmRecommendation => this.isValidRecommendation(v),
    });
    if (!res) return null;
    this.ledger.note(res.data, `${res.provider}/${res.model}`);
    return res.data;
  }

  /** Which model wrote a recommendation this client returned, e.g. "gemini/gemini-3.8-flash". */
  modelUsed(rec: UpsellLlmRecommendation | null): string | null {
    return this.ledger.of(rec);
  }

  private isValidRecommendation(value: unknown): value is UpsellLlmRecommendation {
    if (!value || typeof value !== 'object') return false;
    const rec = value as Record<string, unknown>;

    return (
      typeof rec.offer === 'string' &&
      rec.offer.length > 0 &&
      (rec.bundle === null || (typeof rec.bundle === 'string' && rec.bundle.length > 0)) &&
      typeof rec.priority === 'string' &&
      VALID_PRIORITIES.has(rec.priority) &&
      typeof rec.channel === 'string' &&
      VALID_CHANNELS.has(rec.channel) &&
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
