import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
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
const REQUEST_TIMEOUT_MS = 12000; // @google/genai rejects deadlines under 10s

/**
 * Recommends strategy/offer/channel/message for a retention action the rule
 * engine has already decided is needed. Never decides whether retention is
 * required. Any failure returns null so the caller falls back to the
 * rule-only, canned-copy path — mirrors FollowupLlmClient. Uses Gemini via
 * @google/genai rather than OpenAI — config.httpOptions.timeout is
 * unreliable on some SDK versions (googleapis/js-genai#1277), so the call is
 * additionally raced against a manual timeout.
 */
@Injectable()
export class RetentionLlmClient {
  private readonly logger = new Logger(RetentionLlmClient.name);
  private readonly model = process.env.GEMINI_MODEL_RETENTION ?? 'gemini-2.5-flash';
  private client: GoogleGenAI | null = null;

  async recommend(profile: RetentionCustomerProfile): Promise<RetentionLlmRecommendation | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }

    try {
      const response = await this.withTimeout(
        this.getClient(apiKey).models.generateContent({
          model: this.model,
          contents: buildRetentionLlmUserPrompt(profile),
          config: {
            systemInstruction: RETENTION_LLM_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.4,
            httpOptions: { timeout: REQUEST_TIMEOUT_MS },
          },
        }),
        REQUEST_TIMEOUT_MS,
      );

      const raw = response.text;
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

  private getClient(apiKey: string): GoogleGenAI {
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey });
    }
    return this.client;
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
