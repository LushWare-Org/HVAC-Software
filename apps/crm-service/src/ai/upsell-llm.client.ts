import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { UpsellCustomerProfile, UpsellLlmRecommendation } from '@tscrm/types';
import { UPSELL_LLM_SYSTEM_PROMPT, buildUpsellLlmUserPrompt } from './upsell-llm.prompt';

const VALID_CHANNELS = new Set(['whatsapp', 'email', 'call']);
const VALID_PRIORITIES = new Set(['Low', 'Medium', 'High']);
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Recommends the specific offer/bundle/channel/message for an upsell
 * opportunity the rule engine has already decided exists. Never decides
 * whether an upsell opportunity exists, or its category. Any failure returns
 * null so the caller falls back to the rule-only, canned-copy path — mirrors
 * RetentionLlmClient.
 */
@Injectable()
export class UpsellLlmClient {
  private readonly logger = new Logger(UpsellLlmClient.name);
  private readonly model = process.env.OPENAI_MODEL_UPSELL ?? 'gpt-4o-mini';
  private client: OpenAI | null = null;

  async recommend(profile: UpsellCustomerProfile): Promise<UpsellLlmRecommendation | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return null;
    }

    try {
      const completion = await this.getClient(apiKey).chat.completions.create(
        {
          model: this.model,
          response_format: { type: 'json_object' },
          temperature: 0.4,
          messages: [
            { role: 'system', content: UPSELL_LLM_SYSTEM_PROMPT },
            { role: 'user', content: buildUpsellLlmUserPrompt(profile) },
          ],
        },
        { timeout: REQUEST_TIMEOUT_MS },
      );

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        this.logger.warn('Upsell LLM returned an empty response');
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!this.isValidRecommendation(parsed)) {
        this.logger.warn(`Upsell LLM returned an unexpected shape: ${raw}`);
        return null;
      }

      return parsed;
    } catch (error) {
      this.logger.warn(`Upsell LLM recommendation unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  private getClient(apiKey: string): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
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
