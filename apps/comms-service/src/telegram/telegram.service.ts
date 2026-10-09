/**
 * Telegram add-on: each company connects its own bot, and customers and
 * technicians link their Telegram chat to it with a one-time code.
 *
 * Linked people get their in-app conversation mirrored to Telegram (see
 * TelegramRelay) and can reply there; replies land in the same in-app
 * conversation as if they had typed them in the app. The in-app chat stays
 * the full record and works the same with or without Telegram.
 */
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'crypto';
import { isFeatureEnabled } from '@tscrm/types';
import type { TelegramBot, TelegramLink } from '../prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { ChatService } from '../chat/chat.service';
import { ChatDirectory } from '../chat/chat.directory';
import { OFFICE_ROLES, customerKey, isCustomer, isOffice, isTechnician, type Viewer } from '../chat/chat.policy';
import { TelegramApiError, looksLikeToken, tg, type TgMessage, type TgUpdate, type TgUser } from './telegram.api';
import { hashCode, newLinkCode, openToken, sealToken } from './telegram.crypto';
import { escHtml, parseInbound, startLink } from './telegram.format';
import { telegramInviteHtml } from './telegram.email';

const SELF_CODE_MS = 30 * 60 * 1000; // a code shown in the app or portal
const INVITE_CODE_MS = 14 * 24 * 60 * 60 * 1000; // a code sent by email
const MAX_INVITES = 1000;

/** An office person's Telegram alert settings. */
export interface OfficePrefs { alertScope: 'all' | 'mine'; quietFrom: string | null; quietTo: string | null }
export const DEFAULT_OFFICE_PREFS: OfficePrefs = { alertScope: 'all', quietFrom: null, quietTo: null };
export const officePrefs = (raw: unknown): OfficePrefs => {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const hhmm = (v: unknown) => (typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : null);
  return { alertScope: p.alertScope === 'mine' ? 'mine' : 'all', quietFrom: hhmm(p.quietFrom), quietTo: hhmm(p.quietTo) };
};

export interface Member {
  memberKind: 'CUSTOMER' | 'STAFF';
  memberKey: string;
  customerId: string | null;
  userId: string | null;
  name: string;
}

/** Where Telegram should call us, or null when it can't reach this server (local development: we poll instead). */
export function webhookUrl(botId: string): string | null {
  const base = (process.env.TELEGRAM_WEBHOOK_BASE_URL || process.env.API_GATEWAY_URL || '').replace(/\/+$/, '');
  return /^https:\/\//i.test(base) ? `${base}/api/comms/telegram/webhook/${botId}` : null;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly bots = new Map<string, { bot: TelegramBot | null; at: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly chat: ChatService,
    private readonly dir: ChatDirectory,
    private readonly notifications: NotificationsService,
    private readonly settings: CompanySettingsClient,
  ) {}

  // ── The company's bot ───────────────────────────────────────────────────

  /** The company's bot (cached for a minute; most messages need this and nothing else). */
  async botFor(companyId: string): Promise<TelegramBot | null> {
    const hit = this.bots.get(companyId);
    if (hit && Date.now() - hit.at < 60_000) return hit.bot;
    // Before the Telegram tables exist this simply means "no bot", so chat carries on.
    const bot = await this.prisma.telegramBot.findUnique({ where: { companyId } }).catch(() => null);
    this.bots.set(companyId, { bot, at: Date.now() });
    return bot;
  }

  /** The bot, only when it is switched on and the company has the add-on. */
  async liveBot(companyId: string): Promise<TelegramBot | null> {
    const bot = await this.botFor(companyId);
    if (!bot?.enabled) return null;
    const s = await this.settings.getSettings(companyId);
    return isFeatureEnabled(s.features, 'telegram') ? bot : null;
  }

  private forget(companyId: string) {
    this.bots.delete(companyId);
  }

  token(bot: TelegramBot): string {
    return openToken(bot.tokenEnc);
  }

  async send(bot: TelegramBot, chatId: string, text: string, extra: Record<string, unknown> = {}) {
    return tg<TgMessage>(this.token(bot), 'sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });
  }

  /** A picture with the message as its caption (Telegram allows 1024 characters there). */
  async sendPhoto(bot: TelegramBot, chatId: string, photoUrl: string, caption: string, extra: Record<string, unknown> = {}) {
    return tg<TgMessage>(this.token(bot), 'sendPhoto', {
      chat_id: chatId, photo: photoUrl, caption: caption.length > 1024 ? `${caption.slice(0, 1020)}…` : caption, parse_mode: 'HTML', ...extra,
    }, 20_000);
  }

  /** What the office sees on the Telegram settings page. Never includes the token. */
  async status(companyId: string) {
    const [bot, s] = await Promise.all([this.prisma.telegramBot.findUnique({ where: { companyId } }), this.settings.getSettings(companyId)]);
    const available = isFeatureEnabled(s.features, 'telegram');
    if (!bot) return { available, connected: false as const };
    const counts = await this.prisma.telegramLink.groupBy({
      by: ['memberKind'], where: { companyId, botId: bot.id, unlinkedAt: null }, _count: { _all: true },
    });
    const n = (k: string) => counts.find((c) => c.memberKind === k)?._count._all ?? 0;
    const staffLinks = n('STAFF') ? await this.prisma.telegramLink.findMany({ where: { companyId, botId: bot.id, unlinkedAt: null, memberKind: 'STAFF' }, select: { userId: true } }) : [];
    const roles = await this.staffRoles(companyId, staffLinks.map((l) => l.userId).filter((x): x is string => !!x));
    const office = staffLinks.filter((l) => l.userId && OFFICE_ROLES.includes(roles.get(l.userId) ?? '')).length;
    return {
      available, connected: true as const,
      bot: { username: bot.username, name: bot.displayName, link: `https://t.me/${bot.username}` },
      enabled: bot.enabled, mode: bot.mode,
      lastError: bot.lastError, lastErrorAt: bot.lastErrorAt,
      linked: { customers: n('CUSTOMER'), staff: n('STAFF') - office, office },
      officeAlerts: bot.officeAlerts,
      connectedAt: bot.createdAt,
    };
  }

  /** Checks the token with Telegram, points the bot at us, and keeps the token encrypted. */
  async connect(companyId: string, userId: string, rawToken: string) {
    const token = String(rawToken ?? '').trim();
    if (!looksLikeToken(token)) throw new BadRequestException('That doesn\'t look like a bot token. Copy the whole line BotFather gave you, like 123456789:AAH…');
    let me: TgUser;
    try {
      me = await tg<TgUser>(token, 'getMe');
    } catch (err) {
      throw new BadRequestException(err instanceof TelegramApiError && err.code === 401
        ? 'Telegram didn\'t accept that token. In BotFather, use /mybots → your bot → API Token, and copy it again.'
        : `Telegram couldn't check the token: ${(err as Error).message}`);
    }
    if (!me.is_bot || !me.username) throw new BadRequestException('That token isn\'t for a bot.');
    const taken = await this.prisma.telegramBot.findFirst({ where: { botUserId: String(me.id), companyId: { not: companyId } } });
    if (taken) throw new ConflictException('That bot is already connected to another company. Create a new bot in BotFather for this one.');

    const existing = await this.prisma.telegramBot.findUnique({ where: { companyId } });
    const companyName = await this.dir.companyName(companyId);
    const data = {
      botUserId: String(me.id), username: me.username,
      displayName: [me.first_name, me.last_name].filter(Boolean).join(' ') || me.username,
      tokenEnc: sealToken(token), webhookSecret: randomBytes(24).toString('base64url'),
      enabled: true, lastError: null, lastErrorAt: null, connectedById: userId, pollOffset: BigInt(0),
    };
    const bot = existing
      ? await this.prisma.telegramBot.update({ where: { companyId }, data })
      : await this.prisma.telegramBot.create({ data: { companyId, ...data } });
    // A different bot means the old Telegram chats can't be reached any more.
    if (existing && existing.botUserId !== String(me.id)) {
      await this.prisma.telegramLink.updateMany({ where: { companyId, unlinkedAt: null }, data: { unlinkedAt: new Date(), unlinkReason: 'bot_changed' } });
    }

    const url = webhookUrl(bot.id);
    if (url) {
      await tg(token, 'setWebhook', { url, secret_token: bot.webhookSecret, allowed_updates: ['message', 'edited_message'], drop_pending_updates: true });
    } else {
      await tg(token, 'deleteWebhook', { drop_pending_updates: true }).catch(() => undefined);
    }
    const mode = url ? 'webhook' : 'polling';
    const saved = await this.prisma.telegramBot.update({ where: { id: bot.id }, data: { mode } });
    // The bot's menu and profile text, so it looks like part of the company. Best effort.
    await Promise.allSettled([
      tg(token, 'setMyCommands', { commands: [
        { command: 'start', description: 'Connect or check your connection' },
        { command: 'help', description: 'How this chat works' },
        { command: 'stop', description: `Stop getting ${companyName} messages here` },
      ] }),
      tg(token, 'setMyShortDescription', { short_description: `Messages from ${companyName}`.slice(0, 120) }),
      tg(token, 'setMyDescription', { description: `Chat with ${companyName} here. To connect, open the Telegram link in your ${companyName} app, customer portal or email.`.slice(0, 512) }),
    ]);
    this.forget(companyId);
    this.logger.log(`telegram bot @${saved.username} connected for ${companyId} (${mode})`);
    return this.status(companyId);
  }

  async setEnabled(companyId: string, change: { enabled?: boolean; officeAlerts?: boolean }) {
    const bot = await this.prisma.telegramBot.findUnique({ where: { companyId } });
    if (!bot) throw new NotFoundException('Connect a bot first');
    await this.prisma.telegramBot.update({
      where: { companyId },
      data: { ...(change.enabled !== undefined && { enabled: change.enabled }), ...(change.officeAlerts !== undefined && { officeAlerts: change.officeAlerts }) },
    });
    this.forget(companyId);
    return this.status(companyId);
  }

  /** Disconnects the bot. Linked chats stop getting messages; the in-app history is untouched. */
  async disconnect(companyId: string) {
    const bot = await this.prisma.telegramBot.findUnique({ where: { companyId } });
    if (!bot) return { connected: false };
    await tg(this.token(bot), 'deleteWebhook', {}).catch(() => undefined);
    await this.prisma.telegramLink.updateMany({ where: { companyId, unlinkedAt: null }, data: { unlinkedAt: new Date(), unlinkReason: 'disconnected' } });
    await this.prisma.telegramBot.delete({ where: { companyId } });
    this.forget(companyId);
    return { connected: false };
  }

  async recordError(bot: TelegramBot, message: string) {
    await this.prisma.telegramBot.update({ where: { id: bot.id }, data: { lastError: message.slice(0, 300), lastErrorAt: new Date() } }).catch(() => undefined);
  }

  // ── Links ───────────────────────────────────────────────────────────────

  /** The member a signed-in customer or technician links as. */
  async memberFor(v: Viewer): Promise<Member> {
    if (isCustomer(v)) {
      if (!v.customerId) throw new BadRequestException('Sign in again');
      const c = await this.dir.customer(v.companyId, v.customerId);
      return { memberKind: 'CUSTOMER', memberKey: customerKey(v.customerId), customerId: v.customerId, userId: v.userId, name: c?.name || v.name };
    }
    if (!isTechnician(v) && !isOffice(v)) throw new BadRequestException('Telegram isn\'t available for this account.');
    return { memberKind: 'STAFF', memberKey: v.userId, customerId: null, userId: v.userId, name: v.name };
  }

  activeLink(companyId: string, memberKey: string) {
    return this.prisma.telegramLink.findFirst({ where: { companyId, memberKey, unlinkedAt: null }, orderBy: { linkedAt: 'desc' } });
  }

  private async issueCode(companyId: string, m: Member, ttlMs: number) {
    const { code, hash } = newLinkCode();
    await this.prisma.telegramLinkCode.create({
      data: { companyId, codeHash: hash, memberKind: m.memberKind, memberKey: m.memberKey, customerId: m.customerId, userId: m.userId, name: m.name, expiresAt: new Date(Date.now() + ttlMs) },
    });
    return code;
  }

  /** For the portal and apps: is Telegram on offer here, and is this person linked? */
  async me(v: Viewer) {
    const bot = await this.liveBot(v.companyId);
    if (!bot || !(isCustomer(v) || isTechnician(v) || isOffice(v))) return { available: false as const };
    // The company can keep its inbox off staff phones.
    if (isOffice(v) && !bot.officeAlerts) return { available: false as const, officeAlertsOff: true };
    const m = await this.memberFor(v);
    const link = await this.activeLink(v.companyId, m.memberKey);
    return {
      ...(isOffice(v) ? { prefs: officePrefs(link?.prefs) } : {}),
      available: true as const,
      bot: { username: bot.username, name: bot.displayName, link: `https://t.me/${bot.username}` },
      linked: !!link,
      telegramName: link ? (link.tgUsername ? `@${link.tgUsername}` : link.tgName) : null,
      linkedAt: link?.linkedAt ?? null,
      alsoPush: link?.alsoPush ?? false,
    };
  }

  /** A fresh one-time link that connects this person's Telegram (valid 30 minutes). */
  async linkForMe(v: Viewer) {
    const bot = await this.liveBot(v.companyId);
    if (!bot) throw new BadRequestException('Telegram isn\'t set up for this company');
    const code = await this.issueCode(v.companyId, await this.memberFor(v), SELF_CODE_MS);
    return { url: startLink(bot.username, code), botUsername: bot.username, expiresAt: new Date(Date.now() + SELF_CODE_MS) };
  }

  async unlinkMe(v: Viewer) {
    const m = await this.memberFor(v);
    await this.unlinkMember(v.companyId, m.memberKey, 'by_person', true);
    return { linked: false };
  }

  /** The signed-in person's own settings: also-push (anyone), and alert settings (office). */
  async updateMe(v: Viewer, change: { alsoPush?: boolean; alertScope?: 'all' | 'mine'; quietFrom?: string | null; quietTo?: string | null }) {
    const m = await this.memberFor(v);
    const link = await this.activeLink(v.companyId, m.memberKey);
    if (!link) throw new BadRequestException('Connect Telegram first');
    const prefs = isOffice(v)
      ? officePrefs({ ...officePrefs(link.prefs), ...Object.fromEntries(Object.entries({ alertScope: change.alertScope, quietFrom: change.quietFrom, quietTo: change.quietTo }).filter(([, x]) => x !== undefined)) })
      : undefined;
    await this.prisma.telegramLink.update({
      where: { id: link.id },
      data: { ...(change.alsoPush !== undefined && { alsoPush: change.alsoPush }), ...(prefs && { prefs: prefs as unknown as object }) },
    });
    return this.me(v);
  }

  /** Sends the signed-in person a sample message on Telegram, so they can see it works. */
  async testMe(v: Viewer) {
    const bot = await this.liveBot(v.companyId);
    const m = await this.memberFor(v);
    const link = await this.activeLink(v.companyId, m.memberKey);
    if (!bot || !link) throw new BadRequestException('Connect Telegram first');
    await this.send(bot, link.chatId, isOffice(v)
      ? `<b>Test alert</b>\nThis is how new customer and technician messages will arrive. Use Telegram's <b>Reply</b> on an alert to answer that person.`
      : `<b>Test message</b>\nMessages from ${escHtml(await this.dir.companyName(v.companyId))} will arrive here.`);
    return { sent: true };
  }

  /** Current roles of staff logins (active, approved only), for telling office staff from technicians. */
  async staffRoles(companyId: string, userIds: string[]): Promise<Map<string, string>> {
    if (!userIds.length) return new Map();
    const rows = await this.prisma.$queryRawUnsafe<Array<{ id: string; role: string }>>(
      `SELECT id, role FROM crm.company_users
        WHERE "companyId" = $1 AND id = ANY($2::text[]) AND role <> 'customer' AND "isActive" = true
          AND COALESCE("approvalStatus"::text, 'APPROVED') = 'APPROVED'`,
      companyId, userIds,
    );
    return new Map(rows.map((r) => [r.id, String(r.role).toLowerCase()]));
  }

  /** Unlinks a person, and tells them in Telegram when asked to. */
  async unlinkMember(companyId: string, memberKey: string, reason: string, tell: boolean) {
    const links = await this.prisma.telegramLink.findMany({ where: { companyId, memberKey, unlinkedAt: null } });
    if (!links.length) return 0;
    await this.prisma.telegramLink.updateMany({ where: { id: { in: links.map((l) => l.id) } }, data: { unlinkedAt: new Date(), unlinkReason: reason } });
    const bot = tell ? await this.botFor(companyId) : null;
    if (bot) {
      const company = await this.dir.companyName(companyId);
      for (const l of links) await this.send(bot, l.chatId, `You won't get ${escHtml(company)} messages here any more. You can connect again any time from the app or portal.`).catch(() => undefined);
    }
    return links.length;
  }

  /** For the office: who is linked (all, or one customer). */
  async links(companyId: string, customerId?: string) {
    const rows = await this.prisma.telegramLink.findMany({
      where: { companyId, unlinkedAt: null, ...(customerId ? { customerId } : {}) },
      orderBy: { linkedAt: 'desc' }, take: 1000,
    });
    const roles = await this.staffRoles(companyId, rows.filter((l) => l.memberKind === 'STAFF' && l.userId).map((l) => l.userId as string));
    return rows.map((l) => ({
      id: l.id, memberKind: l.memberKind, memberKey: l.memberKey, customerId: l.customerId, userId: l.userId, name: l.name,
      role: l.memberKind === 'STAFF' && l.userId ? roles.get(l.userId) ?? null : 'customer',
      telegramName: l.tgUsername ? `@${l.tgUsername}` : l.tgName, linkedAt: l.linkedAt,
    }));
  }

  async unlinkById(companyId: string, id: string) {
    const link = await this.prisma.telegramLink.findFirst({ where: { id, companyId, unlinkedAt: null } });
    if (!link) throw new NotFoundException('That Telegram link was not found');
    await this.unlinkMember(companyId, link.memberKey, 'by_office', true);
    return { unlinked: true };
  }

  // ── Email invitations ───────────────────────────────────────────────────

  /**
   * Emails each person their own one-tap Telegram link (valid 14 days).
   * Pass ids, or allCustomers to invite every customer with an email who isn't linked yet.
   */
  async invite(companyId: string, opts: { customerIds?: string[]; userIds?: string[]; allCustomers?: boolean; note?: string }) {
    const bot = await this.liveBot(companyId);
    if (!bot) throw new BadRequestException('Connect a Telegram bot first');
    const [linked, company] = await Promise.all([
      this.prisma.telegramLink.findMany({ where: { companyId, unlinkedAt: null }, select: { memberKey: true } }),
      this.settings.getSettings(companyId),
    ]);
    const linkedKeys = new Set(linked.map((l) => l.memberKey));

    const people: Array<Member & { email: string | null }> = [];
    if (opts.allCustomers || opts.customerIds?.length) {
      const rows = await this.prisma.$queryRawUnsafe<Array<{ id: string; name: string; email: string | null }>>(
        `SELECT id, TRIM(CONCAT("firstName", ' ', "lastName")) AS name, email FROM crm.customers
          WHERE "companyId" = $1 AND "isActive" = true ${opts.allCustomers ? '' : 'AND id = ANY($2::text[])'}
          ORDER BY "createdAt" DESC LIMIT ${MAX_INVITES}`,
        ...(opts.allCustomers ? [companyId] : [companyId, opts.customerIds]),
      );
      for (const r of rows) people.push({ memberKind: 'CUSTOMER', memberKey: customerKey(r.id), customerId: r.id, userId: null, name: r.name || 'there', email: r.email });
    }
    if (opts.userIds?.length) {
      const rows = await this.prisma.$queryRawUnsafe<Array<{ id: string; name: string; email: string | null }>>(
        `SELECT id, name, email FROM crm.company_users
          WHERE "companyId" = $1 AND id = ANY($2::text[]) AND role = 'technician' AND "isActive" = true`,
        companyId, opts.userIds.slice(0, MAX_INVITES),
      );
      for (const r of rows) people.push({ memberKind: 'STAFF', memberKey: r.id, customerId: null, userId: r.id, name: r.name, email: r.email });
    }

    let sent = 0, noEmail = 0, alreadyLinked = 0, failed = 0;
    const note = String(opts.note ?? '').trim().slice(0, 600);
    for (const p of people) {
      if (linkedKeys.has(p.memberKey)) { alreadyLinked++; continue; }
      if (!p.email) { noEmail++; continue; }
      try {
        const code = await this.issueCode(companyId, p, INVITE_CODE_MS);
        await this.notifications.sendEmail({
          companyId, customerId: p.customerId ?? undefined, recipientId: p.customerId ?? p.userId ?? p.memberKey,
          recipientName: p.name, recipientEmail: p.email,
          subject: `Get ${company.name || 'our'} messages on Telegram`,
          htmlBody: telegramInviteHtml({
            companyName: company.name || 'Your service team', logoUrl: company.logoUrl ?? null, name: p.name,
            link: startLink(bot.username, code), botUsername: bot.username, note, forTechnician: p.memberKind === 'STAFF',
          }),
        });
        sent++;
      } catch (err) {
        failed++;
        this.logger.warn(`telegram invite to ${p.memberKey} failed: ${(err as Error).message}`);
      }
    }
    return { sent, alreadyLinked, noEmail, failed, total: people.length };
  }

  // ── What arrives from Telegram ──────────────────────────────────────────

  /** A webhook call: only accepted with the secret Telegram was given for this bot. */
  async webhook(botId: string, secret: string | undefined, update: TgUpdate) {
    const bot = await this.prisma.telegramBot.findUnique({ where: { id: botId } });
    if (!bot || !secret) return false;
    const a = Buffer.from(secret);
    const b = Buffer.from(bot.webhookSecret);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    await this.handleUpdate(bot, update);
    return true;
  }

  async handleUpdate(bot: TelegramBot, update: TgUpdate) {
    try {
      if (update.message) await this.onMessage(bot, update.message);
      else if (update.edited_message) await this.onEdited(bot, update.edited_message);
    } catch (err) {
      this.logger.warn(`telegram update ${update.update_id} failed: ${(err as Error).message}`);
    }
  }

  private async onMessage(bot: TelegramBot, msg: TgMessage) {
    if (msg.chat.type !== 'private') return; // groups and channels aren't supported
    const chatId = String(msg.chat.id);
    const company = await this.dir.companyName(bot.companyId);
    const link = await this.prisma.telegramLink.findUnique({ where: { botId_chatId: { botId: bot.id, chatId } } });
    const active = link && !link.unlinkedAt ? link : null;
    const parsed = parseInbound(msg.text ?? msg.caption ?? (msg.photo || msg.document ? '' : null));
    const reply = (text: string) => this.send(bot, chatId, text).catch(() => undefined);

    if (parsed?.kind === 'start') {
      if (parsed.code) return this.redeem(bot, msg, parsed.code, active, company);
      return reply(active
        ? `You're connected to ${escHtml(company)} as <b>${escHtml(active.name)}</b>. Write here any time and we'll see it.`
        : `Hi! This is ${escHtml(company)}'s chat. To connect, open the <b>Telegram</b> link in your ${escHtml(company)} app, customer portal, or the email we sent you.`);
    }
    if (parsed?.kind === 'stop') {
      if (!active) return reply('This chat isn\'t connected.');
      await this.unlinkMember(bot.companyId, active.memberKey, 'by_person', false);
      return reply(`Done. You won't get ${escHtml(company)} messages here any more. Reconnect any time from the app or portal.`);
    }
    if (parsed?.kind === 'help') {
      return reply(active
        ? `Messages from ${escHtml(company)} arrive here, and anything you write goes straight to them. Reply to a message to answer that person. Send /stop to disconnect.`
        : `To connect, open the Telegram link in your ${escHtml(company)} app, customer portal, or email.`);
    }
    if (!active) return reply(`This chat isn't connected yet. Open the Telegram link in your ${escHtml(company)} app, customer portal, or email to connect.`);
    if (!(await this.liveBot(bot.companyId))) return reply(`${escHtml(company)} has paused Telegram messages. Please use the app or portal for now.`);

    const hasFile = !!(msg.photo?.length || msg.document);
    const text = parsed?.kind === 'text' ? parsed.text : '';
    const body = [text, hasFile ? '[Sent a photo or file on Telegram. Ask them to add it in the app if you need it.]' : ''].filter(Boolean).join('\n');
    if (!body) return;

    const viewer = await this.viewerFor(bot.companyId, active);
    if (!viewer) {
      await this.unlinkMember(bot.companyId, active.memberKey, 'account_gone', false);
      return reply(`Your ${escHtml(company)} account isn't active any more, so this chat has been disconnected.`);
    }
    const conversationId = await this.routeFor(viewer, active, msg.reply_to_message?.message_id);
    if (!conversationId) return reply(this.noRouteText(viewer));
    await this.chat.send(viewer, conversationId, { body, clientId: `tg:${chatId}:${msg.message_id}` });
    if (hasFile) await reply('Got your message. Photos and files sent here aren\'t shared yet, so please add them in the app or portal.');
  }

  /** Telegram lets people edit; we follow within the in-app edit window. */
  private async onEdited(bot: TelegramBot, msg: TgMessage) {
    const chatId = String(msg.chat.id);
    const link = await this.prisma.telegramLink.findFirst({ where: { botId: bot.id, chatId, unlinkedAt: null } });
    if (!link) return;
    const original = await this.prisma.chatMessage.findFirst({ where: { companyId: bot.companyId, clientId: `tg:${chatId}:${msg.message_id}` } });
    const text = (msg.text ?? msg.caption ?? '').trim();
    if (!original || !text) return;
    const viewer = await this.viewerFor(bot.companyId, link);
    if (viewer) await this.chat.edit(viewer, original.id, text).catch(() => undefined);
  }

  private async redeem(bot: TelegramBot, msg: TgMessage, code: string, active: TelegramLink | null, company: string) {
    const chatId = String(msg.chat.id);
    const reply = (text: string) => this.send(bot, chatId, text).catch(() => undefined);
    const row = await this.prisma.telegramLinkCode.findUnique({ where: { codeHash: hashCode(code) } });
    if (!row || row.companyId !== bot.companyId) return reply('That link isn\'t valid. Open a fresh Telegram link from the app or portal.');
    if (row.usedAt || row.expiresAt < new Date()) {
      if (active?.memberKey === row.memberKey) return reply(`You're already connected to ${escHtml(company)}.`);
      return reply('That link has expired. Open a fresh Telegram link from the app or portal.');
    }
    // Used once, even if two taps race.
    const used = await this.prisma.telegramLinkCode.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
    if (!used.count) return reply(`You're already connected to ${escHtml(company)}.`);

    // One Telegram chat per person: an older chat they linked is let go.
    await this.prisma.telegramLink.updateMany({
      where: { companyId: bot.companyId, memberKey: row.memberKey, unlinkedAt: null, NOT: { chatId } },
      data: { unlinkedAt: new Date(), unlinkReason: 'relinked' },
    });
    const from: Partial<TgUser> = msg.from ?? {};
    const tgName = [from.first_name, from.last_name].filter(Boolean).join(' ') || null;
    const fields = {
      companyId: bot.companyId, memberKind: row.memberKind, memberKey: row.memberKey, customerId: row.customerId, userId: row.userId,
      name: row.name, tgUsername: from.username ?? null, tgName, linkedAt: new Date(), unlinkedAt: null, unlinkReason: null,
    };
    await this.prisma.telegramLink.upsert({
      where: { botId_chatId: { botId: bot.id, chatId } },
      create: { botId: bot.id, chatId, ...fields },
      update: fields,
    });
    const first = row.name.split(' ')[0] || 'there';
    await reply(row.memberKind === 'CUSTOMER'
      ? `You're connected, ${escHtml(first)}! 🎉\n\nMessages from ${escHtml(company)} will arrive here, and anything you write here goes straight to the office. Your app and portal keep the full history.\n\nSend /stop any time to disconnect.`
      : row.userId && OFFICE_ROLES.includes((await this.staffRoles(bot.companyId, [row.userId])).get(row.userId) ?? '')
        ? `You're connected, ${escHtml(first)}! 🎉\n\nNew messages from customers and technicians will arrive here as alerts. To answer one, use Telegram's <b>Reply</b> on it and your answer goes to that person as you.\n\nChange which alerts you get in the dashboard under Settings → Telegram. Send /stop any time to disconnect.`
        : `You're connected, ${escHtml(first)}! 🎉\n\nMessages from the office arrive here, and you can reply right here. Send /stop any time to disconnect.`);
  }

  /** Who a linked chat writes as. Null when that customer or technician no longer exists or is inactive. */
  private async viewerFor(companyId: string, link: TelegramLink): Promise<Viewer | null> {
    if (link.memberKind === 'CUSTOMER' && link.customerId) {
      const c = await this.dir.customer(companyId, link.customerId);
      if (!c) return null;
      return { userId: link.userId ?? `telegram:${link.chatId}`, companyId, role: 'customer', name: c.name || link.name, customerId: c.id };
    }
    if (link.memberKind === 'STAFF' && link.userId) {
      const u = await this.dir.staff(companyId, link.userId);
      if (!u || !(u.role === 'technician' || OFFICE_ROLES.includes(String(u.role).toLowerCase()))) return null;
      return { userId: u.id, companyId, role: u.role, name: u.name, customerId: null };
    }
    return null;
  }

  /**
   * Which conversation a reply belongs to: the one the message they replied to
   * came from, when they used Telegram's reply; otherwise their chat with the office.
   */
  private async routeFor(v: Viewer, link: TelegramLink, replyTo?: number): Promise<string | null> {
    if (replyTo) {
      const d = await this.prisma.telegramDelivery.findFirst({ where: { linkId: link.id, tgMessageId: replyTo } });
      const m = d ? await this.prisma.chatMessage.findUnique({ where: { id: d.messageId }, select: { conversationId: true } }) : null;
      if (m) {
        try {
          await this.chat.visible(v, m.conversationId);
          return m.conversationId;
        } catch { /* not theirs any more: fall back to the office */ }
      }
    }
    if (isCustomer(v)) return (await this.chat.openOffice(v)).id;
    if (isTechnician(v)) return (await this.chat.openTechOffice(v)).id;
    return null; // office staff answer a particular alert, so they must use Reply
  }

  /** What to tell someone whose message had nowhere to go. */
  private noRouteText(v: Viewer) {
    return isOffice(v)
      ? 'To answer someone, use Telegram\'s <b>Reply</b> on their alert (press and hold the alert, then Reply). To start a new conversation, use the dashboard.'
      : 'Messages here go to the office. Please use the app to chat with others.';
  }
}
