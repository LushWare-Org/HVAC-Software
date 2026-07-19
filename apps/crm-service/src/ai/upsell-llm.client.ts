import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
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
 * RetentionLlmClient. Uses Gemini via @google/genai rather than OpenAI —
 * config.httpOptions.timeout is unreliable on some SDK versions
 * (googleapis/js-genai#1277), so the call is additionally raced against a
 * manual timeout.
 */
@Injectable()
export class UpsellLlmClient {
  private readonly logger = new Logger(UpsellLlmClient.name);
  private readonly model = process.env.GEMINI_MODEL_UPSELL ?? 'gemini-2.5-flash';
  private client: GoogleGenAI | null = null;

  async recommend(profile: UpsellCustomerProfile): Promise<UpsellLlmRecommendation | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }

    try {
      const response = await this.withTimeout(
        this.getClient(apiKey).models.generateContent({
          model: this.model,
          contents: buildUpsellLlmUserPrompt(profile),
          config: {
            systemInstruction: UPSELL_LLM_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.4,
            httpOptions: { timeout: REQUEST_TIMEOUT_MS },
          },
        }),
        REQUEST_TIMEOUT_MS,
      );

      const raw = response.text;
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
