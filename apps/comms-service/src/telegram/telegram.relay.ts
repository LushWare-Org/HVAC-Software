/**
 * Mirrors in-app conversations to linked Telegram chats: new messages, edits
 * and deletions. Runs off the chat bus, so sending a message never waits on
 * Telegram, and a Telegram failure never fails the message.
 */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { TelegramBot, TelegramLink } from '../prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { ChatBus, type ChatEvent, type ConvRef, type ShapedMessage } from '../chat/chat.bus';
import { ChatDirectory } from '../chat/chat.directory';
import { ChatGateway } from '../chat/chat.gateway';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { OFFICE_KEY, OFFICE_ROLES } from '../chat/chat.policy';
import { TelegramApiError, tg } from './telegram.api';
import { renderOutbound } from './telegram.format';
import { TelegramService, officePrefs } from './telegram.service';
import { dashboardButton, inQuietHours, minutesNow, officeAlertText } from './telegram.office';

const ALERT_GAP_MS = 60_000; // one alert per conversation per person per minute
const SHARED_INBOX = ['CUSTOMER_OFFICE', 'TECH_OFFICE'];

/** How a message's sender reads to this Telegram reader. */
export function fromLabel(conv: Pick<ConvRef, 'kind'>, m: Pick<ShapedMessage, 'senderKind' | 'senderMemberKey' | 'senderName'>, reader: Pick<TelegramLink, 'memberKey' | 'memberKind'>, company: string): string {
  if (m.senderMemberKey === reader.memberKey) return 'You, in the app';
  if (m.senderKind === 'SYSTEM') return company;
  if (m.senderKind === 'KELVIN') return `Kelvin · ${company}`;
  if (m.senderMemberKey === OFFICE_KEY) return reader.memberKind === 'CUSTOMER' ? `${m.senderName} · ${company}` : `${m.senderName} · Office`;
  if (conv.kind === 'CUSTOMER_TECH' && reader.memberKind === 'CUSTOMER') return `${m.senderName} · Technician`;
  return m.senderName;
}

/** A line saying which conversation this is, when it isn't the reader's main chat with the office. */
export function contextLine(conv: Pick<ConvRef, 'kind' | 'title' | 'customerName' | 'members'>, reader: Pick<TelegramLink, 'memberKey' | 'memberKind'>): string | null {
  switch (conv.kind) {
    case 'CUSTOMER_OFFICE':
    case 'TECH_OFFICE':
      return null;
    case 'CUSTOMER_TECH':
      if (reader.memberKind === 'CUSTOMER') {
        const tech = (conv.members as Array<{ memberKey: string; name?: string; kind?: string }>).find((x) => x.kind === 'STAFF');
        return `private chat with ${tech?.name ?? 'your technician'}`;
      }
      return `chat with ${conv.customerName ?? 'a customer'}`;
    default:
      return conv.title ? `in ${conv.title}` : 'team chat';
  }
}

@Injectable()
export class TelegramRelay implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramRelay.name);
  private off?: () => void;
  private readonly lastAlert = new Map<string, number>();

  constructor(
    private readonly bus: ChatBus,
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    private readonly dir: ChatDirectory,
    private readonly gateway: ChatGateway,
    private readonly settings: CompanySettingsClient,
  ) {}

  onModuleInit() {
    this.off = this.bus.on((e) => {
      if (e.type === 'message') {
        void this.onMessage(e.conv, e.message).catch((err) => this.logger.warn(`telegram relay failed: ${err.message}`));
        void this.officeAlerts(e.conv, e.message).catch((err) => this.logger.warn(`telegram office alert failed: ${err.message}`));
      }
      if (e.type === 'message_updated') void this.onUpdated(e.conv, e.message).catch((err) => this.logger.warn(`telegram edit failed: ${err.message}`));
    });
  }

  onModuleDestroy() {
    this.off?.();
  }

  private async readers(conv: ConvRef): Promise<{ bot: TelegramBot; links: TelegramLink[] } | null> {
    const bot = await this.telegram.liveBot(conv.companyId);
    if (!bot) return null;
    const keys = conv.members.filter((m) => !m.leftAt && m.memberKey !== OFFICE_KEY).map((m) => m.memberKey);
    if (!keys.length) return null;
    const links = await this.prisma.telegramLink.findMany({ where: { companyId: conv.companyId, botId: bot.id, memberKey: { in: keys }, unlinkedAt: null } });
    return links.length ? { bot, links } : null;
  }

  async onMessage(conv: ConvRef, m: ShapedMessage) {
    const r = await this.readers(conv);
    if (!r) return;
    const company = await this.dir.companyName(conv.companyId);
    for (const link of r.links) {
      // Their own Telegram message: it is already in their Telegram chat.
      if (m.clientId?.startsWith(`tg:${link.chatId}:`)) continue;
      const context = contextLine(conv, link);
      const files = Array.isArray(m.attachments) ? (m.attachments as Array<{ url: string; name?: string; type?: string }>) : [];
      // A picture (e.g. the technician's photo on "on the way") goes as a photo with the message as its caption.
      const photo = files.find((a) => /^image\//i.test(a.type ?? '') && /^https:\/\//i.test(a.url));
      const text = renderOutbound({
        from: fromLabel(conv, m, link, company), context, jobNumber: m.jobNumber, body: m.body,
        attachments: files.filter((a) => a !== photo),
      });
      let status: 'sent' | 'failed' = 'sent';
      let tgMessageId: number | null = null;
      let error: string | null = null;
      try {
        if (photo) {
          try {
            tgMessageId = (await this.telegram.sendPhoto(r.bot, link.chatId, photo.url, text)).message_id;
          } catch (err) {
            if (err instanceof TelegramApiError && err.gone) throw err;
            tgMessageId = (await this.telegram.send(r.bot, link.chatId, text)).message_id; // the picture couldn't be fetched: words only
          }
        } else {
          tgMessageId = (await this.telegram.send(r.bot, link.chatId, text)).message_id;
        }
      } catch (err) {
        status = 'failed';
        error = (err as Error).message.slice(0, 300);
        if (err instanceof TelegramApiError && err.gone) {
          await this.prisma.telegramLink.update({ where: { id: link.id }, data: { unlinkedAt: new Date(), unlinkReason: 'blocked' } });
        } else if (err instanceof TelegramApiError && err.code === 401) {
          await this.telegram.recordError(r.bot, 'Telegram rejected the bot token. Reconnect the bot in Settings → Telegram.');
        }
      }
      await this.prisma.telegramDelivery.upsert({
        where: { messageId_linkId: { messageId: m.id, linkId: link.id } },
        create: { companyId: conv.companyId, messageId: m.id, linkId: link.id, chatId: link.chatId, tgMessageId, status, error },
        update: { tgMessageId, status, error },
      });
      this.bus.publish({ type: 'delivery', conv, messageId: m.id, channel: 'telegram', status });
    }
  }

  /**
   * A customer or technician wrote to the shared inbox: alert office staff who linked
   * their Telegram, unless someone in the office is already looking at it, it's muted,
   * they were just alerted about it, it's their quiet hours, or (if they chose so)
   * it isn't a conversation they have replied in. Replying to the alert answers in it.
   */
  async officeAlerts(conv: ConvRef, m: ShapedMessage) {
    if (!SHARED_INBOX.includes(conv.kind) || m.senderMemberKey === OFFICE_KEY || m.deletedAt) return;
    const bot = await this.telegram.liveBot(conv.companyId);
    if (!bot?.officeAlerts) return;
    const links = await this.prisma.telegramLink.findMany({ where: { companyId: conv.companyId, botId: bot.id, memberKind: 'STAFF', unlinkedAt: null } });
    if (!links.length) return;
    const roles = await this.telegram.staffRoles(conv.companyId, links.map((l) => l.userId).filter((x): x is string => !!x));
    const office = links.filter((l) => l.userId && OFFICE_ROLES.includes(roles.get(l.userId) ?? ''));
    if (!office.length) return;
    const seat = (conv.members as Array<{ memberKey: string; mutedUntil?: Date | null }>).find((x) => x.memberKey === OFFICE_KEY);
    if (seat?.mutedUntil && new Date(seat.mutedUntil).getTime() > Date.now()) return;
    if (await this.gateway.isViewing([`office:${conv.companyId}`], conv.id)) return;

    const { timezone } = await this.settings.getSettings(conv.companyId);
    const nowMin = minutesNow(timezone || 'UTC');
    const text = officeAlertText({
      senderName: m.senderName, who: conv.kind === 'TECH_OFFICE' ? 'technician' : 'customer', jobNumber: m.jobNumber, body: m.body,
      attachments: Array.isArray(m.attachments) ? m.attachments.length : 0,
    });
    for (const link of office) {
      const prefs = officePrefs(link.prefs);
      const key = `${conv.id}|${link.id}`;
      if (Date.now() - (this.lastAlert.get(key) ?? 0) < ALERT_GAP_MS) continue;
      if (inQuietHours(prefs, nowMin)) continue;
      if (prefs.alertScope === 'mine') {
        const replied = await this.prisma.chatMessage.findFirst({ where: { conversationId: conv.id, senderUserId: link.userId }, select: { id: true } });
        if (!replied) continue;
      }
      this.lastAlert.set(key, Date.now());
      try {
        const sent = await this.telegram.send(bot, link.chatId, text, dashboardButton(conv.id));
        // Remembered so a Reply to this alert lands in this conversation. "alert", not "sent": it isn't a copy of an office message.
        await this.prisma.telegramDelivery.upsert({
          where: { messageId_linkId: { messageId: m.id, linkId: link.id } },
          create: { companyId: conv.companyId, messageId: m.id, linkId: link.id, chatId: link.chatId, tgMessageId: sent.message_id, status: 'alert' },
          update: { tgMessageId: sent.message_id, status: 'alert' },
        });
      } catch (err) {
        if (err instanceof TelegramApiError && err.gone) {
          await this.prisma.telegramLink.update({ where: { id: link.id }, data: { unlinkedAt: new Date(), unlinkReason: 'blocked' } });
        }
      }
    }
    if (this.lastAlert.size > 5000) this.lastAlert.clear();
  }

  /** Bots may edit and delete their own messages, so edits and deletions follow. */
  async onUpdated(conv: ConvRef, m: ShapedMessage) {
    const deliveries = await this.prisma.telegramDelivery.findMany({ where: { messageId: m.id, status: 'sent', tgMessageId: { not: null } } });
    if (!deliveries.length) return;
    const bot = await this.telegram.liveBot(conv.companyId);
    if (!bot) return;
    const token = this.telegram.token(bot);
    const company = await this.dir.companyName(conv.companyId);
    const links = await this.prisma.telegramLink.findMany({ where: { id: { in: deliveries.map((d) => d.linkId) } } });
    for (const d of deliveries) {
      const link = links.find((l) => l.id === d.linkId);
      if (!link) continue;
      if (m.deletedAt) {
        await tg(token, 'deleteMessage', { chat_id: d.chatId, message_id: d.tgMessageId }).catch(() => undefined);
        continue;
      }
      const text = renderOutbound({ from: fromLabel(conv, m, link, company), context: contextLine(conv, link), jobNumber: m.jobNumber, body: m.body, edited: true });
      await tg(token, 'editMessageText', { chat_id: d.chatId, message_id: d.tgMessageId, text, parse_mode: 'HTML', disable_web_page_preview: true }).catch(() => undefined);
    }
  }
}
