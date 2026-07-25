import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import type { InsightLlmRecommendation, InsightSignal } from './insight-types';
import { INSIGHT_LLM_SYSTEM_PROMPT, buildInsightLlmUserPrompt } from './insight-llm.prompt';

const VALID_PRIORITIES = new Set(['Low', 'Medium', 'High']);
const REQUEST_TIMEOUT_MS = 8000;
const MAX_TITLE_LENGTH = 60;
const MAX_ACTION_LABEL_LENGTH = 60;

/**
 * Writes title/description/actionLabel/priority/reason/confidence for a
 * revenue-recommendation opportunity the rule engine has already decided
 * exists and already fully quantified. Never authors a dollar figure — the
 * caller (InsightValidationService) always uses the rule engine's `impact`.
 * Any failure returns null so the caller falls back to a rule-only, canned
 * description — mirrors apps/crm-service/src/ai/upsell-llm.client.ts. Uses
 * Gemini via @google/genai rather than OpenAI — config.httpOptions.timeout
 * is unreliable on some SDK versions (googleapis/js-genai#1277), so the call
 * is additionally raced against a manual timeout.
 */
@Injectable()
export class InsightLlmClient {
  private readonly logger = new Logger(InsightLlmClient.name);
  private readonly model = process.env.GEMINI_MODEL_INSIGHTS ?? 'gemini-2.5-flash';
  private client: GoogleGenAI | null = null;

  async recommend(signal: InsightSignal): Promise<InsightLlmRecommendation | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }

    try {
      const response = await this.withTimeout(
        this.getClient(apiKey).models.generateContent({
          model: this.model,
          contents: buildInsightLlmUserPrompt(signal),
          config: {
            systemInstruction: INSIGHT_LLM_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.4,
            httpOptions: { timeout: REQUEST_TIMEOUT_MS },
          },
        }),
        REQUEST_TIMEOUT_MS,
      );

      const raw = response.text;
      if (!raw) {
        this.logger.warn('Insight LLM returned an empty response');
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!this.isValidRecommendation(parsed)) {
        this.logger.warn(`Insight LLM returned an unexpected shape: ${raw}`);
        return null;
      }

      return parsed;
    } catch (error) {
      this.logger.warn(`Insight LLM recommendation unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  private isValidRecommendation(value: unknown): value is InsightLlmRecommendation {
    if (!value || typeof value !== 'object') return false;
    const rec = value as Record<string, unknown>;

    return (
      typeof rec.title === 'string' &&
      rec.title.length > 0 &&
      rec.title.length <= MAX_TITLE_LENGTH &&
      typeof rec.description === 'string' &&
      rec.description.length > 0 &&
      typeof rec.actionLabel === 'string' &&
      rec.actionLabel.length > 0 &&
      rec.actionLabel.length <= MAX_ACTION_LABEL_LENGTH &&
      typeof rec.priority === 'string' &&
      VALID_PRIORITIES.has(rec.priority) &&
      typeof rec.reason === 'string' &&
      rec.reason.length > 0 &&
      typeof rec.confidence === 'number' &&
      rec.confidence >= 0 &&
      rec.confidence <= 1
    );
  }
}
