import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { FollowupCustomerProfile, FollowupLlmRecommendation } from '@tscrm/types';
import { FOLLOWUP_LLM_SYSTEM_PROMPT, buildFollowupLlmUserPrompt } from './followup-llm.prompt';

const VALID_CHANNELS = new Set(['SMS', 'EMAIL']);
const VALID_PRIORITIES = new Set(['Low', 'Medium', 'High']);
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Recommends channel/timing/message for a follow-up the rule engine has
 * already decided is needed. Never decides whether to follow up.
 * Mirrors UpsellLlmClient/RetentionLlmClient's fallback posture: any failure
 * returns null so the caller can fall back to the rule-only, canned-copy path.
 */
@Injectable()
export class FollowupLlmClient {
  private readonly logger = new Logger(FollowupLlmClient.name);
  private readonly model = process.env.OPENAI_MODEL_FOLLOWUP ?? 'gpt-4o-mini';
  private client: OpenAI | null = null;

  async recommend(profile: FollowupCustomerProfile): Promise<FollowupLlmRecommendation | null> {
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
            { role: 'system', content: FOLLOWUP_LLM_SYSTEM_PROMPT },
            { role: 'user', content: buildFollowupLlmUserPrompt(profile) },
          ],
        },
        { timeout: REQUEST_TIMEOUT_MS },
      );

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        this.logger.warn('Follow-up LLM returned an empty response');
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!this.isValidRecommendation(parsed)) {
        this.logger.warn(`Follow-up LLM returned an unexpected shape: ${raw}`);
        return null;
      }

      return parsed;
    } catch (error) {
      this.logger.warn(`Follow-up LLM recommendation unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  private getClient(apiKey: string): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
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
