import { BadRequestException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const KELVIN_EVENT_TYPES = ['SHOWN', 'SPOKE', 'DISMISSED', 'FIX_USED', 'ACTION_DONE', 'ACTION_FAILED'] as const;
export type KelvinEventType = (typeof KELVIN_EVENT_TYPES)[number];
export const SPEAK_MODES = ['ALL', 'URGENT_ONLY', 'NEVER'] as const;
export type SpeakMode = (typeof SPEAK_MODES)[number];

export interface KelvinEventInput {
  companyId: string;
  userId: string;
  type: KelvinEventType;
  itemId?: string;
  action?: string;
  recordRef?: string;
  summary: string;
  confirmedBy?: string;
}

export interface KelvinPrefsView { speakMode: SpeakMode; quietUntil: string | null }

const RETENTION_DAYS = 90;
const MAX_IDS = 200;
const cut = (s: unknown, n: number) => (typeof s === 'string' ? s.slice(0, n) : undefined);

/** Kelvin's memory: what he told each person, what he did, and how chatty they want him. */
@Injectable()
export class KelvinLogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KelvinLogService.name);
  private purgeTimer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Daily; unref so it never holds the process open.
    this.purgeTimer = setInterval(() => void this.purge(), 24 * 60 * 60 * 1000);
    this.purgeTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.purgeTimer) clearInterval(this.purgeTimer);
  }

  async record(e: KelvinEventInput): Promise<void> {
    if (!e?.companyId || !e.userId || !KELVIN_EVENT_TYPES.includes(e.type)) return;
    await this.prisma.kelvinEvent.create({
      data: {
        companyId: e.companyId, userId: e.userId, type: e.type,
        itemId: cut(e.itemId, 200), action: cut(e.action, 60), recordRef: cut(e.recordRef, 120),
        summary: cut(e.summary, 300) ?? '', confirmedBy: cut(e.confirmedBy, 120),
      },
    });
  }

  async state(companyId: string, userId: string, itemIds: string[]) {
    const ids = [...new Set(itemIds.filter((i) => typeof i === 'string'))].slice(0, MAX_IDS);
    if (!ids.length) return { spoken: [], seen: [], dismissed: [] };
    const rows = await this.prisma.kelvinEvent.findMany({
      where: { companyId, userId, itemId: { in: ids }, type: { in: ['SPOKE', 'SHOWN', 'DISMISSED'] } },
      select: { itemId: true, type: true },
    });
    const pick = (t: string) => [...new Set(rows.filter((r: any) => r.type === t).map((r: any) => r.itemId as string))];
    return { spoken: pick('SPOKE'), seen: pick('SHOWN'), dismissed: pick('DISMISSED') };
  }

  async since(companyId: string, userId: string, since: Date) {
    const rows = await this.prisma.kelvinEvent.findMany({
      where: { companyId, userId, createdAt: { gte: since }, type: { in: ['ACTION_DONE', 'ACTION_FAILED', 'SPOKE'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { type: true, summary: true, action: true, recordRef: true, createdAt: true },
    });
    return { data: rows };
  }

  async prefs(companyId: string, userId: string): Promise<KelvinPrefsView> {
    const row = await this.prisma.kelvinPrefs.findUnique({ where: { companyId_userId: { companyId, userId } } });
    return { speakMode: (row?.speakMode as SpeakMode) ?? 'ALL', quietUntil: row?.quietUntil ? new Date(row.quietUntil).toISOString() : null };
  }

  async setPrefs(companyId: string, userId: string, input: { speakMode?: SpeakMode; quietUntil?: string | null }): Promise<KelvinPrefsView> {
    if (input.speakMode !== undefined && !SPEAK_MODES.includes(input.speakMode)) {
      throw new BadRequestException('speakMode must be ALL, URGENT_ONLY or NEVER');
    }
    let quietUntil: Date | null | undefined;
    if (input.quietUntil === null) quietUntil = null;
    else if (input.quietUntil !== undefined) {
      quietUntil = new Date(input.quietUntil);
      if (Number.isNaN(quietUntil.getTime())) throw new BadRequestException('quietUntil must be an ISO date');
    }
    const update = {
      ...(input.speakMode !== undefined && { speakMode: input.speakMode }),
      ...(quietUntil !== undefined && { quietUntil }),
    };
    const row = await this.prisma.kelvinPrefs.upsert({
      where: { companyId_userId: { companyId, userId } },
      create: { companyId, userId, speakMode: input.speakMode ?? 'ALL', quietUntil: quietUntil ?? null },
      update,
    });
    return { speakMode: row.speakMode as SpeakMode, quietUntil: row.quietUntil ? new Date(row.quietUntil).toISOString() : null };
  }

  async purge(): Promise<void> {
    try {
      const before = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
      await this.prisma.kelvinEvent.deleteMany({ where: { createdAt: { lt: before } } });
    } catch (err) {
      this.logger.warn(`Kelvin log purge failed: ${(err as Error).message}`);
    }
  }
}
