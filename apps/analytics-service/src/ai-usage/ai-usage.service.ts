import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { aiBlockKey, type AiCallRecord } from '@tscrm/ai';
import { createRedisConnection } from '@tscrm/queue';
import { PrismaService } from '../prisma/prisma.service';
import { companyFeatures } from '../ai/ai-gateway.factory';
import {
  budgetReachedReason, monthKey, monthRange, monthStartUtc, nextMonthStartUtc, resolveBudgetUsd, secondsUntilMonthEnd,
} from './budget';

export const AI_USAGE_REDIS = 'AI_USAGE_REDIS';

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', seconds: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
};

export type AiUsageEvent = AiCallRecord & { service: string };

interface Bucket { calls: number; ok: number; failed: number; skipped: number; costUsd: number; inputTokens: number; outputTokens: number }

export interface AiUsageSummary {
  month: string;
  budgetUsd: number;
  spentUsd: number;
  /** Why AI is paused for this company this month, or null. */
  blocked: string | null;
  totals: Bucket;
  byTask: Array<Bucket & { task: string; avgLatencyMs: number | null }>;
  byModel: Array<{ provider: string; model: string; calls: number; costUsd: number }>;
}

const round = (n: number) => Math.round(n * 1e6) / 1e6;
const empty = (): Bucket => ({ calls: 0, ok: 0, failed: 0, skipped: 0, costUsd: 0, inputTokens: 0, outputTokens: 0 });

/**
 * Stores AI usage and keeps monthly budgets honest. After any paid call it
 * re-adds the company's spend for the month; at or over budget it sets the
 * Redis block every service's AI guard checks, until the month ends.
 */
@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);
  private redis: RedisLike | null;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(AI_USAGE_REDIS) redis?: RedisLike,
  ) {
    this.redis = redis ?? null;
  }

  private conn(): RedisLike {
    return (this.redis ??= createRedisConnection() as unknown as RedisLike);
  }

  async record(event: AiUsageEvent): Promise<void> {
    await this.prisma.aiUsage.create({
      data: {
        companyId: event.companyId ?? null,
        service: event.service,
        task: event.task,
        ok: event.ok,
        provider: event.provider ?? null,
        model: event.model ?? null,
        attempts: event.attempts,
        latencyMs: Math.round(event.latencyMs),
        inputTokens: event.usage?.inputTokens ?? null,
        outputTokens: event.usage?.outputTokens ?? null,
        costUsd: event.costUsd ?? null,
        skipped: event.skipped ?? null,
        error: event.error?.slice(0, 500) ?? null,
        createdAt: event.at ? new Date(event.at) : undefined,
      },
    });
    if (event.companyId && event.costUsd) await this.enforceBudget(event.companyId);
  }

  async budgetFor(companyId: string): Promise<number> {
    return resolveBudgetUsd(await companyFeatures(this.prisma, companyId));
  }

  async spentUsd(companyId: string, start: Date, end: Date): Promise<number> {
    const agg = await this.prisma.aiUsage.aggregate({
      where: { companyId, createdAt: { gte: start, lt: end } },
      _sum: { costUsd: true },
    });
    return round(Number(agg._sum.costUsd ?? 0));
  }

  /** Blocks or unblocks a company for the rest of the month, based on its spend so far. */
  async enforceBudget(companyId: string, now = new Date()): Promise<{ budgetUsd: number; spentUsd: number; blocked: boolean }> {
    const [budgetUsd, spentUsd] = await Promise.all([
      this.budgetFor(companyId),
      this.spentUsd(companyId, monthStartUtc(now), nextMonthStartUtc(now)),
    ]);
    const blocked = spentUsd >= budgetUsd;
    try {
      if (blocked) {
        await this.conn().set(aiBlockKey(companyId), budgetReachedReason(budgetUsd, now), 'EX', secondsUntilMonthEnd(now));
        this.logger.warn(`AI paused for company ${companyId}: $${spentUsd} of $${budgetUsd} used this month`);
      } else {
        // A raised budget takes effect on the next paid call, not next month.
        await this.conn().del(aiBlockKey(companyId));
      }
    } catch (err) {
      this.logger.warn(`Could not update the AI budget block for ${companyId}: ${(err as Error).message}`);
    }
    return { budgetUsd, spentUsd, blocked };
  }

  async summary(companyId: string, month: string = monthKey(new Date())): Promise<AiUsageSummary | null> {
    const range = monthRange(month);
    if (!range) return null;
    const where = { companyId, createdAt: { gte: range.start, lt: range.end } };

    const [groups, skipped, budgetUsd, blocked] = await Promise.all([
      this.prisma.aiUsage.groupBy({
        by: ['task', 'provider', 'model', 'ok'],
        where: { ...where, skipped: null },
        _count: { _all: true },
        _sum: { costUsd: true, inputTokens: true, outputTokens: true },
        _avg: { latencyMs: true },
      }),
      this.prisma.aiUsage.groupBy({ by: ['task'], where: { ...where, skipped: { not: null } }, _count: { _all: true } }),
      this.budgetFor(companyId),
      this.conn().get(aiBlockKey(companyId)).catch(() => null),
    ]);

    return summarize(month, budgetUsd, blocked, groups as unknown as UsageGroup[], skipped as unknown as SkipGroup[]);
  }
}

export interface UsageGroup {
  task: string; provider: string | null; model: string | null; ok: boolean;
  _count: { _all: number };
  _sum: { costUsd: unknown; inputTokens: number | null; outputTokens: number | null };
  _avg: { latencyMs: number | null };
}
export interface SkipGroup { task: string; _count: { _all: number } }

/** Folds grouped rows into totals, per-task and per-model views. Pure, for testing. */
export function summarize(month: string, budgetUsd: number, blocked: string | null, groups: UsageGroup[], skipped: SkipGroup[]): AiUsageSummary {
  const totals = empty();
  const tasks = new Map<string, Bucket & { latencySum: number; latencyN: number }>();
  const models = new Map<string, { provider: string; model: string; calls: number; costUsd: number }>();
  const task = (name: string) => {
    let t = tasks.get(name);
    if (!t) tasks.set(name, (t = { ...empty(), latencySum: 0, latencyN: 0 }));
    return t;
  };

  for (const g of groups) {
    const n = g._count._all;
    const cost = Number(g._sum.costUsd ?? 0);
    const t = task(g.task);
    for (const b of [totals, t]) {
      b.calls += n;
      if (g.ok) b.ok += n; else b.failed += n;
      b.costUsd += cost;
      b.inputTokens += g._sum.inputTokens ?? 0;
      b.outputTokens += g._sum.outputTokens ?? 0;
    }
    if (g.ok && g._avg.latencyMs !== null) { t.latencySum += g._avg.latencyMs * n; t.latencyN += n; }
    if (g.ok && g.provider && g.model) {
      const key = `${g.provider}/${g.model}`;
      const m = models.get(key) ?? { provider: g.provider, model: g.model, calls: 0, costUsd: 0 };
      m.calls += n; m.costUsd += cost;
      models.set(key, m);
    }
  }
  for (const s of skipped) {
    const n = s._count._all;
    totals.calls += n; totals.skipped += n;
    const t = task(s.task); t.calls += n; t.skipped += n;
  }

  totals.costUsd = round(totals.costUsd);
  return {
    month,
    budgetUsd,
    spentUsd: totals.costUsd,
    blocked,
    totals,
    byTask: [...tasks.entries()]
      .map(([name, t]) => {
        const { latencySum, latencyN, ...bucket } = t;
        return { task: name, ...bucket, costUsd: round(bucket.costUsd), avgLatencyMs: latencyN ? Math.round(latencySum / latencyN) : null };
      })
      .sort((a, b) => b.costUsd - a.costUsd || b.calls - a.calls),
    byModel: [...models.values()].map((m) => ({ ...m, costUsd: round(m.costUsd) })).sort((a, b) => b.costUsd - a.costUsd),
  };
}
