import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import type { FollowupCustomerProfile, FollowupLlmRecommendation } from '@tscrm/types';
import { FOLLOWUP_LLM_SYSTEM_PROMPT, buildFollowupLlmUserPrompt } from './followup-llm.prompt';

const VALID_CHANNELS = new Set(['SMS', 'EMAIL']);
const VALID_PRIORITIES = new Set(['Low', 'Medium', 'High']);
const REQUEST_TIMEOUT_MS = 12000; // @google/genai rejects deadlines under 10s

/**
 * Recommends channel/timing/message for a follow-up the rule engine has
 * already decided is needed. Never decides whether to follow up.
 * Mirrors UpsellLlmClient/RetentionLlmClient's fallback posture: any failure
 * returns null so the caller can fall back to the rule-only, canned-copy path.
 * Uses Gemini via @google/genai rather than OpenAI — config.httpOptions.timeout
 * is unreliable on some SDK versions (googleapis/js-genai#1277), so the call
 * is additionally raced against a manual timeout.
 */
@Injectable()
export class FollowupLlmClient {
  private readonly logger = new Logger(FollowupLlmClient.name);
  private readonly model = process.env.GEMINI_MODEL_FOLLOWUP ?? 'gemini-2.5-flash';
  private client: GoogleGenAI | null = null;

  async recommend(profile: FollowupCustomerProfile): Promise<FollowupLlmRecommendation | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }

    try {
      const response = await this.withTimeout(
        this.getClient(apiKey).models.generateContent({
          model: this.model,
          contents: buildFollowupLlmUserPrompt(profile),
          config: {
            systemInstruction: FOLLOWUP_LLM_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.4,
            httpOptions: { timeout: REQUEST_TIMEOUT_MS },
          },
        }),
        REQUEST_TIMEOUT_MS,
      );

      const raw = response.text;
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
