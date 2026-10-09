/**
 * Local development only: Telegram can't call a laptop, so bots connected
 * without a public https address fetch their messages instead (long polling).
 * In production bots use the webhook and nothing polls. Turn this off with
 * TELEGRAM_POLLING=off.
 */
import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramApiError, tg, type TgUpdate } from './telegram.api';
import { TelegramService } from './telegram.service';

@Injectable()
export class TelegramPoller implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(TelegramPoller.name);
  private readonly running = new Set<string>();
  private timer?: ReturnType<typeof setInterval>;
  private stopped = false;

  constructor(private readonly prisma: PrismaService, private readonly telegram: TelegramService) {}

  onApplicationBootstrap() {
    if (process.env.TELEGRAM_POLLING === 'off' || process.env.NODE_ENV === 'test') return;
    const scan = () => void this.scan().catch((err) => this.logger.warn(`telegram poll scan failed: ${err.message}`));
    this.timer = setInterval(scan, 15_000);
    setTimeout(scan, 3_000);
  }

  onModuleDestroy() {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
  }

  private async scan() {
    const bots = await this.prisma.telegramBot.findMany({ where: { mode: 'polling', enabled: true }, select: { id: true } }).catch(() => []);
    for (const b of bots) if (!this.running.has(b.id)) void this.loop(b.id);
  }

  private async loop(botId: string) {
    this.running.add(botId);
    try {
      while (!this.stopped) {
        const bot = await this.prisma.telegramBot.findUnique({ where: { id: botId } });
        if (!bot || bot.mode !== 'polling' || !bot.enabled) return;
        try {
          const updates = await tg<TgUpdate[]>(this.telegram.token(bot), 'getUpdates', {
            offset: Number(bot.pollOffset), timeout: 25, allowed_updates: ['message', 'edited_message'],
          }, 35_000);
          for (const u of updates) await this.telegram.handleUpdate(bot, u);
          if (updates.length || bot.lastError) {
            // Reaching Telegram again clears an old warning from the settings page.
            await this.prisma.telegramBot.update({
              where: { id: botId },
              data: { ...(updates.length ? { pollOffset: BigInt(updates[updates.length - 1].update_id + 1) } : {}), lastError: null, lastErrorAt: null },
            });
          }
        } catch (err) {
          // A slow or dropped connection just means "try again"; it isn't worth a warning.
          if (err instanceof TelegramApiError && err.code === 0) { await new Promise((r) => setTimeout(r, 3_000)); continue; }
          const msg = err instanceof TelegramApiError && err.code === 409
            ? 'Two places tried to read this bot\'s messages at once. It recovers by itself; if this message stays, reconnect the bot.'
            : (err as Error).message;
          await this.telegram.recordError(bot, msg);
          await new Promise((r) => setTimeout(r, 5_000));
        }
      }
    } finally {
      this.running.delete(botId);
    }
  }
}
