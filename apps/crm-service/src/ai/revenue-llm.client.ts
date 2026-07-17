import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { RevenueCustomerProfile, RevenueLlmRecommendation } from '@tscrm/types';
import { REVENUE_LLM_SYSTEM_PROMPT, buildRevenueLlmUserPrompt } from './revenue-llm.prompt';

const VALID_CHANNELS = new Set(['whatsapp', 'email', 'call']);
const VALID_PRIORITIES = new Set(['Low', 'Medium', 'High']);
const REQUEST_TIMEOUT_MS = 8000;
const MAX_MESSAGE_LENGTH = 320;

/**
 * Recommends strategy/action/impact-framing/channel/message for a revenue
 * opportunity the rule engine has already decided exists. Never decides
 * whether an opportunity exists or which category it belongs to. Any
 * failure returns null so the caller falls back to the rule-only, no-message
 * path — mirrors RetentionLlmClient/UpsellLlmClient.
 */
@Injectable()
export class RevenueLlmClient {
  private readonly logger = new Logger(RevenueLlmClient.name);
  private readonly model = process.env.OPENAI_MODEL_REVENUE ?? 'gpt-4o-mini';
  private client: OpenAI | null = null;

  async recommend(profile: RevenueCustomerProfile): Promise<RevenueLlmRecommendation | null> {
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
            { role: 'system', content: REVENUE_LLM_SYSTEM_PROMPT },
            { role: 'user', content: buildRevenueLlmUserPrompt(profile) },
          ],
        },
        { timeout: REQUEST_TIMEOUT_MS },
      );

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        this.logger.warn('Revenue LLM returned an empty response');
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!this.isValidRecommendation(parsed)) {
        this.logger.warn(`Revenue LLM returned an unexpected shape: ${raw}`);
        return null;
      }

      return parsed;
    } catch (error) {
      this.logger.warn(`Revenue LLM recommendation unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  private getClient(apiKey: string): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
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
