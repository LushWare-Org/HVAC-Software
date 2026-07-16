import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { RetentionCustomerProfile, RetentionLlmRecommendation } from '@tscrm/types';
import { RETENTION_LLM_SYSTEM_PROMPT, buildRetentionLlmUserPrompt } from './retention-llm.prompt';

const VALID_CHANNELS = new Set(['whatsapp', 'email', 'call']);
const VALID_PRIORITIES = new Set(['Low', 'Medium', 'High']);
const VALID_ACTIONS = new Set([
  'premium_contract_offer',
  'discount_retention_offer',
  'maintenance_plan_offer',
  'no_action',
]);
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Recommends strategy/offer/channel/message for a retention action the rule
 * engine has already decided is needed. Never decides whether retention is
 * required. Any failure returns null so the caller falls back to the
 * rule-only, canned-copy path — mirrors FollowupLlmClient.
 */
@Injectable()
export class RetentionLlmClient {
  private readonly logger = new Logger(RetentionLlmClient.name);
  private readonly model = process.env.OPENAI_MODEL_RETENTION ?? 'gpt-4o-mini';
  private client: OpenAI | null = null;

  async recommend(profile: RetentionCustomerProfile): Promise<RetentionLlmRecommendation | null> {
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
            { role: 'system', content: RETENTION_LLM_SYSTEM_PROMPT },
            { role: 'user', content: buildRetentionLlmUserPrompt(profile) },
          ],
        },
        { timeout: REQUEST_TIMEOUT_MS },
      );

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        this.logger.warn('Retention LLM returned an empty response');
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!this.isValidRecommendation(parsed)) {
        this.logger.warn(`Retention LLM returned an unexpected shape: ${raw}`);
        return null;
      }

      return parsed;
    } catch (error) {
      this.logger.warn(`Retention LLM recommendation unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  private getClient(apiKey: string): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
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
