import { Injectable, Logger } from '@nestjs/common';
import { AiGateway } from '@tscrm/ai';
import type { InsightLlmRecommendation, InsightSignal } from './insight-types';
import { INSIGHT_LLM_SYSTEM_PROMPT, buildInsightLlmUserPrompt } from './insight-llm.prompt';

const VALID_PRIORITIES = new Set(['Low', 'Medium', 'High']);
/** Results are cached 10 minutes; thinking models can take over 12s. */
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_TITLE_LENGTH = 60;
const MAX_ACTION_LABEL_LENGTH = 60;

/**
 * Writes title/description/actionLabel/priority/reason/confidence for a
 * revenue-recommendation opportunity the rule engine has already decided
 * exists and already fully quantified. Never authors a dollar figure — the
 * caller (InsightValidationService) always uses the rule engine's `impact`.
 *
 * Goes through the shared AI gateway: Gemini first, OpenAI as the backup when
 * OPENAI_API_KEY is set. Returns null only when every model failed, so the
 * caller falls back to its rule-only, canned description.
 */
@Injectable()
export class InsightLlmClient {
  private readonly logger = new Logger(InsightLlmClient.name);
  private readonly gateway = new AiGateway({ logger: this.logger });

  async recommend(signal: InsightSignal, companyId?: string): Promise<InsightLlmRecommendation | null> {
    const res = await this.gateway.generateJson({
      task: 'insights',
      companyId,
      system: INSIGHT_LLM_SYSTEM_PROMPT,
      prompt: buildInsightLlmUserPrompt(signal),
      temperature: 0.4,
      timeoutMs: REQUEST_TIMEOUT_MS,
      routes: [
        { provider: 'gemini', model: process.env.GEMINI_MODEL_INSIGHTS || 'gemini-3.8-flash' },
        { provider: 'openai', model: process.env.OPENAI_MODEL_FALLBACK || 'gpt-4o-mini' },
      ],
      validate: (v): v is InsightLlmRecommendation => this.isValidRecommendation(v),
    });
    return res?.data ?? null;
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
