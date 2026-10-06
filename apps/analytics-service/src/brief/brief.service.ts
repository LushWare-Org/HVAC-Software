import { Injectable, Logger } from '@nestjs/common';
import type { AiGateway } from '@tscrm/ai';
import { Prisma } from '../prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../redis-cache.service';
import { createAnalyticsAiGateway } from '../ai/ai-gateway.factory';
import { DETECTORS, rankFacts, yesterdayStats, type Fact, type FactContext, type Query, type Yesterday } from './facts';
import { localDate } from './local-day';

export interface BriefFact extends Fact {
  /** The AI's one line on why it matters today. Absent when AI was not used. */
  why?: string;
}

export interface Brief {
  date: string;
  timezone: string;
  generatedAt: string;
  headline: string;
  /** True when the AI ordered the facts and wrote the "why" lines. */
  usedAi: boolean;
  facts: BriefFact[];
  yesterday: Yesterday;
  /** Checks that errored, so a gap is visible rather than silent. */
  failedChecks: string[];
}

interface AiBrief {
  headline: string;
  items: Array<{ id: string; why: string }>;
}

const CACHE_SECONDS = 15 * 60;

const SYSTEM_PROMPT = `You write the start-of-day brief for the people running a field service company (HVAC, plumbing, electrical).
You are given facts that exact database checks found. Your job:
1. Order them: what the person should act on first comes first.
2. For each, write one short sentence (under 25 words) on why it matters today or the next step.
3. Write a headline of at most 12 words, in sentence case (capitalise only the first word and names).
Rules: use only names and numbers that appear in the facts. Never add, merge or drop facts. Plain, direct language; no exclamation marks.
Respond with JSON only: {"headline": string, "items": [{"id": string, "why": string}]} with every fact id exactly once.`;

export function isAiBrief(v: unknown): v is AiBrief {
  if (!v || typeof v !== 'object') return false;
  const b = v as Record<string, unknown>;
  return typeof b.headline === 'string' && b.headline.trim().length > 0 && b.headline.length <= 140
    && Array.isArray(b.items)
    && b.items.every((i) => i && typeof i.id === 'string' && typeof i.why === 'string' && i.why.trim().length > 0 && i.why.length <= 300);
}

/** "3 things need you today, 1 urgent" — used when the AI is not. */
export function plainHeadline(facts: Fact[]): string {
  if (!facts.length) return 'Nothing needs you right now.';
  const urgent = facts.filter((f) => f.severity === 'urgent').length;
  return `${facts.length} ${facts.length === 1 ? 'thing needs' : 'things need'} you today${urgent ? `, ${urgent} urgent` : ''}`;
}

/**
 * Applies the AI's order and lines to the facts. Unknown or repeated ids are
 * ignored and any fact the AI skipped keeps its ranked place at the end, so
 * the AI can only reorder and annotate, never hide or invent.
 */
export function applyAiOrder(ranked: Fact[], ai: AiBrief): BriefFact[] {
  const byId = new Map(ranked.map((f) => [f.id, f]));
  const out: BriefFact[] = [];
  const seen = new Set<string>();
  for (const item of ai.items) {
    const fact = byId.get(item.id);
    if (!fact || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push({ ...fact, why: item.why.trim() });
  }
  for (const fact of ranked) if (!seen.has(fact.id)) out.push(fact);
  return out;
}

@Injectable()
export class BriefService {
  private readonly logger = new Logger(BriefService.name);
  private readonly gateway: AiGateway;

  constructor(private readonly prisma: PrismaService, private readonly cache: RedisCacheService) {
    this.gateway = createAnalyticsAiGateway(prisma, this.logger);
  }

  private readonly query: Query = (sql) => this.prisma.$queryRaw(sql);

  async build(companyId: string, opts: { seesMoney: boolean; refresh?: boolean; now?: Date }): Promise<Brief> {
    const now = opts.now ?? new Date();
    const company = (await this.query<{ timezone: string | null; currency: string | null }>(
      Prisma.sql`SELECT timezone, currency FROM crm.companies WHERE id = ${companyId}`,
    ))[0];
    const ctx: FactContext = { companyId, now, timezone: company?.timezone || 'UTC', currency: company?.currency || 'USD' };
    const cacheKey = `analytics:brief:${companyId}:${opts.seesMoney ? 'money' : 'ops'}:${localDate(ctx.timezone, now)}`;

    if (!opts.refresh) {
      const cached = await this.cache.get<Brief>(cacheKey);
      if (cached) return cached;
    }

    const failedChecks: string[] = [];
    const found = await Promise.all(
      Object.entries(DETECTORS).map(async ([name, detect]) => {
        try {
          return await detect(this.query, ctx);
        } catch (err) {
          failedChecks.push(name);
          this.logger.warn(`Brief check ${name} failed for ${companyId}: ${(err as Error).message}`);
          return [];
        }
      }),
    );
    const ranked = rankFacts(found.flat().filter((f) => opts.seesMoney || !f.money));

    let yesterday: Yesterday;
    try {
      yesterday = await yesterdayStats(this.query, ctx);
    } catch (err) {
      failedChecks.push('yesterday');
      this.logger.warn(`Brief yesterday stats failed for ${companyId}: ${(err as Error).message}`);
      yesterday = { date: '', jobsCompleted: 0, jobsCancelled: 0 };
    }
    if (!opts.seesMoney) delete yesterday.collected;

    const ai = ranked.length ? await this.aiOrder(ranked, yesterday, ctx) : null;
    const brief: Brief = {
      date: localDate(ctx.timezone, now),
      timezone: ctx.timezone,
      generatedAt: now.toISOString(),
      headline: ai?.headline.trim() || plainHeadline(ranked),
      usedAi: !!ai,
      facts: ai ? applyAiOrder(ranked, ai) : ranked,
      yesterday,
      failedChecks,
    };
    await this.cache.set(cacheKey, brief, CACHE_SECONDS);
    return brief;
  }

  private async aiOrder(ranked: Fact[], yesterday: Yesterday, ctx: FactContext): Promise<AiBrief | null> {
    const weekday = ctx.now.toLocaleDateString('en-US', { weekday: 'long', timeZone: ctx.timezone });
    const prompt = JSON.stringify({
      today: `${weekday} ${localDate(ctx.timezone, ctx.now)}`,
      yesterday,
      facts: ranked.map((f) => ({
        id: f.id, severity: f.severity, title: f.title, detail: f.detail,
        examples: f.items?.map((i) => [i.label, i.meta].filter(Boolean).join(': ')),
      })),
    });
    const res = await this.gateway.generateJson({
      task: 'brief',
      companyId: ctx.companyId,
      system: SYSTEM_PROMPT,
      prompt,
      temperature: 0.3,
      timeoutMs: 20_000,
      routes: [
        { provider: 'gemini', model: process.env.GEMINI_MODEL_BRIEF || 'gemini-3.8-flash' },
        { provider: 'openai', model: process.env.OPENAI_MODEL_FALLBACK || 'gpt-4o-mini' },
      ],
      validate: isAiBrief,
    });
    return res?.data ?? null;
  }
}
