/**
 * Push for chat messages people aren't looking at. Everyone in the conversation
 * except the sender gets a phone push (app) and/or a browser notification
 * (portal / dashboard), unless they have it open, have muted it, or were just
 * told about it (one push per conversation per minute, so a burst is one ping).
 *
 * The shared office inbox doesn't push: the office works it from the dashboard,
 * where the badge updates live.
 */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { WebPushService } from '../web-push/web-push.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { ChatBus, type ChatEvent, type ConvRef, type ShapedMessage } from './chat.bus';
import { ChatGateway } from './chat.gateway';
import { ChatDirectory } from './chat.directory';
import { PrismaService } from '../prisma/prisma.service';
import { PUSHED_JOB_STATUSES } from '../customer-notifications/customer-notifications.service';

const QUIET_MS = 60_000;

@Injectable()
export class ChatNotifier implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChatNotifier.name);
  private readonly lastPing = new Map<string, number>();
  private off?: () => void;

  constructor(
    private readonly bus: ChatBus,
    private readonly gateway: ChatGateway,
    private readonly notifications: NotificationsService,
    private readonly webPush: WebPushService,
    private readonly crm: CompanySettingsClient,
    private readonly dir: ChatDirectory,
    private readonly prisma?: PrismaService,
  ) {}

  onModuleInit() {
    this.off = this.bus.on((e) => { if (e.type === 'message') void this.onMessage(e).catch((err) => this.logger.warn(`chat push failed: ${err.message}`)); });
  }

  onModuleDestroy() {
    this.off?.();
  }

  async onMessage(e: Extract<ChatEvent, { type: 'message' }>) {
    const { conv, message } = e;
    // Job updates posted by the system ("job:<id>:<STATUS>:<day>") for statuses that already get
    // their own push (on the way, arrived, done…): the in-app message is enough, no second ping.
    const jobStatus = message.clientId?.startsWith('job:') ? message.clientId.split(':')[2] : null;
    if (jobStatus && PUSHED_JOB_STATUSES.has(jobStatus)) return;
    const now = Date.now();
    for (const m of conv.members as Array<ConvRef['members'][number] & { kind?: string; mutedUntil?: Date | null; userId?: string | null; customerId?: string | null }>) {
      if (m.leftAt || m.memberKey === message.senderMemberKey || m.memberKey === 'office') continue;
      if (m.mutedUntil && new Date(m.mutedUntil).getTime() > now) continue;
      const isCustomer = m.memberKey.startsWith('customer:');
      const room = isCustomer ? `c:${conv.companyId}:${m.memberKey.slice(9)}` : `u:${m.memberKey}`;
      if (await this.gateway.isViewing([room], conv.id)) continue;
      const pingKey = `${conv.id}|${m.memberKey}`;
      if (now - (this.lastPing.get(pingKey) ?? 0) < QUIET_MS) continue;
      if (await this.onTelegram(conv.companyId, m.memberKey)) continue;
      this.lastPing.set(pingKey, now);
      await this.push(conv, message, isCustomer ? { to: 'customer', id: m.memberKey.slice(9) } : { to: 'staff', id: m.memberKey });
    }
    if (this.lastPing.size > 5000) this.lastPing.clear();
  }

  /** Linked on Telegram (and the bot is on): Telegram already buzzes their phone, unless they asked for both. */
  private async onTelegram(companyId: string, memberKey: string): Promise<boolean> {
    if (!this.prisma) return false;
    try {
      const link = await this.prisma.telegramLink.findFirst({ where: { companyId, memberKey, unlinkedAt: null, alsoPush: false }, select: { id: true } });
      if (!link) return false;
      const bot = await this.prisma.telegramBot.findUnique({ where: { companyId }, select: { enabled: true } });
      return !!bot?.enabled;
    } catch {
      return false; // Telegram not set up (or unreachable): push as usual
    }
  }

  private async push(conv: ConvRef, message: ShapedMessage, who: { to: 'customer' | 'staff'; id: string }) {
    const contact = await this.crm.getContact(conv.companyId, who.to, who.id);
    if (!contact?.userId) return;
    const company = await this.dir.companyName(conv.companyId);
    // Customers see office replies as the company; everyone else sees the person.
    const fromOffice = message.senderMemberKey === 'office';
    const title = who.to === 'customer' && fromOffice ? company : message.senderName;
    const body = message.deletedAt ? 'Message deleted' : (message.body || '📎 Attachment').slice(0, 180);
    const data = { type: 'chat', conversationId: conv.id };
    if (contact.pushToken) {
      await this.notifications.sendPush({
        companyId: conv.companyId, recipientId: contact.userId, recipientName: contact.name, pushToken: contact.pushToken,
        customerId: who.to === 'customer' ? who.id : undefined, title, body, data,
      });
    }
    if (await this.webPush.hasSubscription(contact.userId)) {
      await this.webPush.sendToUser(contact.userId, { title, body, url: `${who.to === 'customer' ? '/messages' : '/communications'}?c=${encodeURIComponent(conv.id)}`, data });
    }
  }
}
