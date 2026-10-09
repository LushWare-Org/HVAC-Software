import { parseInbound, renderOutbound, startLink } from './telegram.format';
import { hashCode, newLinkCode, openToken, sealToken } from './telegram.crypto';
import { looksLikeToken, TelegramApiError } from './telegram.api';
import { contextLine, fromLabel, TelegramRelay } from './telegram.relay';
import { TelegramService, officePrefs, webhookUrl } from './telegram.service';
import { inQuietHours, officeAlertText } from './telegram.office';
import { ChatBus } from '../chat/chat.bus';

describe('telegram text', () => {
  it('reads /start codes, /stop and plain text', () => {
    expect(parseInbound('/start abcDEF123_-xyz')).toEqual({ kind: 'start', code: 'abcDEF123_-xyz' });
    expect(parseInbound('/start')).toEqual({ kind: 'start', code: null });
    expect(parseInbound('/start <script>')).toEqual({ kind: 'start', code: null });
    expect(parseInbound('/stop')).toEqual({ kind: 'stop' });
    expect(parseInbound('/help@OrrixBot')).toEqual({ kind: 'help' });
    expect(parseInbound('  Is 3pm ok?  ')).toEqual({ kind: 'text', text: 'Is 3pm ok?' });
    expect(parseInbound('')).toBeNull();
  });

  it('escapes what people wrote and labels the sender', () => {
    const t = renderOutbound({ from: 'RP · Orrix', jobNumber: 'JOB-12', body: 'a <b>bold</b> & claim', attachments: [{ url: 'https://x/y.pdf', name: 'Quote' }, { url: 'http://bad', name: 'nope' }] });
    expect(t).toBe('<b>RP · Orrix</b>\n<i>About JOB-12</i>\na &lt;b&gt;bold&lt;/b&gt; &amp; claim\n📎 <a href="https://x/y.pdf">Quote</a>');
    expect(renderOutbound({ from: 'A', body: 'x'.repeat(5000) }).length).toBeLessThanOrEqual(3901);
  });

  it('builds the deep link', () => {
    expect(startLink('OrrixBot', 'code123')).toBe('https://t.me/OrrixBot?start=code123');
  });
});

describe('telegram secrets', () => {
  const env = process.env.TELEGRAM_TOKEN_KEY;
  beforeAll(() => { process.env.TELEGRAM_TOKEN_KEY = 'test-key'; });
  afterAll(() => { process.env.TELEGRAM_TOKEN_KEY = env; });

  it('keeps tokens encrypted and tamper-proof', () => {
    const sealed = sealToken('123456:ABC');
    expect(sealed).not.toContain('ABC');
    expect(openToken(sealed)).toBe('123456:ABC');
    const parts = sealed.split('.');
    parts[3] = Buffer.from('zzzzzz').toString('base64url');
    expect(() => openToken(parts.join('.'))).toThrow();
  });

  it('link codes are random, fit /start, and are stored only as a hash', () => {
    const a = newLinkCode();
    const b = newLinkCode();
    expect(a.code).not.toBe(b.code);
    expect(a.code).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(a.hash).toBe(hashCode(a.code));
    expect(a.hash).not.toContain(a.code);
  });

  it('recognises bot tokens and lost chats', () => {
    expect(looksLikeToken('123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw')).toBe(true);
    expect(looksLikeToken('hello')).toBe(false);
    expect(new TelegramApiError(403, 'Forbidden: bot was blocked by the user').gone).toBe(true);
    expect(new TelegramApiError(429, 'Too Many Requests').gone).toBe(false);
  });

  it('uses the webhook only with a public https address', () => {
    const before = { a: process.env.TELEGRAM_WEBHOOK_BASE_URL, b: process.env.API_GATEWAY_URL };
    process.env.TELEGRAM_WEBHOOK_BASE_URL = '';
    process.env.API_GATEWAY_URL = 'http://localhost:80';
    expect(webhookUrl('bot1')).toBeNull();
    process.env.TELEGRAM_WEBHOOK_BASE_URL = 'https://api.example.com/';
    expect(webhookUrl('bot1')).toBe('https://api.example.com/api/comms/telegram/webhook/bot1');
    process.env.TELEGRAM_WEBHOOK_BASE_URL = before.a;
    process.env.API_GATEWAY_URL = before.b;
  });
});

describe('how mirrored messages read', () => {
  const customer = { memberKey: 'customer:c1', memberKind: 'CUSTOMER' };
  const tech = { memberKey: 'u-tech', memberKind: 'STAFF' };
  const m = (o: any) => ({ senderKind: 'STAFF', senderMemberKey: 'office', senderName: 'Rae', ...o });

  it('names the sender for the reader', () => {
    expect(fromLabel({ kind: 'CUSTOMER_OFFICE' } as any, m({}), customer, 'Orrix')).toBe('Rae · Orrix');
    expect(fromLabel({ kind: 'CUSTOMER_OFFICE' } as any, m({ senderKind: 'KELVIN' }), customer, 'Orrix')).toBe('Kelvin · Orrix');
    expect(fromLabel({ kind: 'CUSTOMER_OFFICE' } as any, m({ senderKind: 'SYSTEM' }), customer, 'Orrix')).toBe('Orrix');
    expect(fromLabel({ kind: 'CUSTOMER_OFFICE' } as any, m({ senderKind: 'CUSTOMER', senderMemberKey: 'customer:c1' }), customer, 'Orrix')).toBe('You, in the app');
    expect(fromLabel({ kind: 'CUSTOMER_TECH' } as any, m({ senderMemberKey: 'u-tech', senderName: 'RP' }), customer, 'Orrix')).toBe('RP · Technician');
    expect(fromLabel({ kind: 'TECH_OFFICE' } as any, m({}), tech, 'Orrix')).toBe('Rae · Office');
  });

  it('says which chat it is when it is not their main one', () => {
    expect(contextLine({ kind: 'CUSTOMER_OFFICE', members: [] } as any, customer)).toBeNull();
    expect(contextLine({ kind: 'CUSTOMER_TECH', members: [{ memberKey: 'u-tech', kind: 'STAFF', name: 'RP' }] } as any, customer)).toBe('private chat with RP');
    expect(contextLine({ kind: 'CUSTOMER_TECH', customerName: 'Ann', members: [] } as any, tech)).toBe('chat with Ann');
  });
});

describe('telegram relay', () => {
  function make(links: any[]) {
    const sent: any[] = [];
    const prisma: any = {
      telegramLink: { findMany: jest.fn(async () => links), update: jest.fn(async () => ({})) },
      telegramDelivery: { upsert: jest.fn(async () => ({})) },
    };
    const telegram: any = {
      liveBot: jest.fn(async () => ({ id: 'bot', companyId: 'co' })),
      send: jest.fn(async (_b: any, chatId: string, text: string) => { sent.push({ chatId, text }); return { message_id: 9 }; }),
      recordError: jest.fn(),
    };
    const bus = new ChatBus();
    const events: any[] = [];
    bus.on((e) => events.push(e));
    const relay = new TelegramRelay(bus, prisma, telegram, { companyName: async () => 'Orrix' } as any, { isViewing: async () => false } as any, { getSettings: async () => ({ timezone: 'UTC' }) } as any);
    return { relay, sent, prisma, events, telegram };
  }
  const conv = { id: 'cv', companyId: 'co', kind: 'CUSTOMER_OFFICE', lastSeq: 3, members: [{ memberKey: 'office' }, { memberKey: 'customer:c1' }] } as any;
  const message = (o: any = {}) => ({ id: 'm1', senderKind: 'STAFF', senderMemberKey: 'office', senderName: 'Rae', body: 'On the way', clientId: null, jobNumber: null, attachments: null, ...o });

  it('sends office replies to the linked customer and records it', async () => {
    const { relay, sent, prisma, events } = make([{ id: 'l1', chatId: '555', memberKey: 'customer:c1', memberKind: 'CUSTOMER' }]);
    await relay.onMessage(conv, message() as any);
    expect(sent).toEqual([{ chatId: '555', text: '<b>Rae · Orrix</b>\nOn the way' }]);
    expect(prisma.telegramDelivery.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ tgMessageId: 9, status: 'sent' }) }));
    expect(events).toEqual([expect.objectContaining({ type: 'delivery', messageId: 'm1', status: 'sent' })]);
  });

  it('sends a picture (the technician photo) as a photo with the message as its caption', async () => {
    const { relay, telegram } = make([{ id: 'l1', chatId: '555', memberKey: 'customer:c1', memberKind: 'CUSTOMER' }]);
    telegram.sendPhoto = jest.fn(async () => ({ message_id: 11 }));
    await relay.onMessage(conv, message({ senderKind: 'SYSTEM', body: 'RP is on the way.', attachments: [{ url: 'https://cdn/rp.jpg', name: 'RP', type: 'image/jpeg' }] }) as any);
    expect(telegram.sendPhoto).toHaveBeenCalledWith(expect.anything(), '555', 'https://cdn/rp.jpg', '<b>Orrix</b>\nRP is on the way.');
  });

  it("doesn't echo a message back to the Telegram chat it came from", async () => {
    const { relay, sent } = make([{ id: 'l1', chatId: '555', memberKey: 'customer:c1', memberKind: 'CUSTOMER' }]);
    await relay.onMessage(conv, message({ senderKind: 'CUSTOMER', senderMemberKey: 'customer:c1', clientId: 'tg:555:41' }) as any);
    expect(sent).toEqual([]);
  });

  it('stops sending to someone who blocked the bot', async () => {
    const { relay, prisma, telegram, events } = make([{ id: 'l1', chatId: '555', memberKey: 'customer:c1', memberKind: 'CUSTOMER' }]);
    telegram.send.mockRejectedValueOnce(new TelegramApiError(403, 'Forbidden: bot was blocked by the user'));
    await relay.onMessage(conv, message() as any);
    expect(prisma.telegramLink.update).toHaveBeenCalledWith({ where: { id: 'l1' }, data: expect.objectContaining({ unlinkReason: 'blocked' }) });
    expect(events[0].status).toBe('failed');
  });
});

describe('telegram linking', () => {
  function make(code: any) {
    const replies: string[] = [];
    const prisma: any = {
      telegramBot: { findUnique: jest.fn(async () => ({ id: 'bot', companyId: 'co', webhookSecret: 'sekret', enabled: true })) },
      telegramLink: { findUnique: jest.fn(async () => null), updateMany: jest.fn(async () => ({ count: 0 })), upsert: jest.fn(async () => ({})) },
      telegramLinkCode: { findUnique: jest.fn(async () => code), updateMany: jest.fn(async () => ({ count: 1 })) },
    };
    const svc = new TelegramService(prisma, {} as any, { companyName: async () => 'Orrix' } as any, {} as any, {} as any);
    jest.spyOn(svc, 'send').mockImplementation(async (_b: any, _c: string, text: string) => { replies.push(text); return { message_id: 1 } as any; });
    return { svc, prisma, replies };
  }
  const update = (text: string) => ({ update_id: 1, message: { message_id: 7, chat: { id: 555, type: 'private' }, from: { id: 555, first_name: 'Ann', username: 'ann' }, date: 0, text } });

  it('ignores calls without the right secret', async () => {
    const { svc, prisma } = make(null);
    expect(await svc.webhook('bot', 'wrong', update('/start x') as any)).toBe(false);
    expect(await svc.webhook('bot', undefined, update('/start x') as any)).toBe(false);
    expect(prisma.telegramLinkCode.findUnique).not.toHaveBeenCalled();
  });

  it('a valid code links this chat to that customer, once', async () => {
    const code = { id: 'k', companyId: 'co', memberKind: 'CUSTOMER', memberKey: 'customer:c1', customerId: 'c1', userId: 'u1', name: 'Ann Lee', expiresAt: new Date(Date.now() + 60_000), usedAt: null };
    const { svc, prisma, replies } = make(code);
    expect(await svc.webhook('bot', 'sekret', update('/start abcdefgh12345678') as any)).toBe(true);
    expect(prisma.telegramLink.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { botId_chatId: { botId: 'bot', chatId: '555' } },
      create: expect.objectContaining({ memberKey: 'customer:c1', customerId: 'c1', tgUsername: 'ann' }),
    }));
    expect(replies[0]).toContain("You're connected, Ann");
  });

  it('refuses expired codes and codes from another company', async () => {
    const expired = make({ id: 'k', companyId: 'co', memberKey: 'customer:c1', expiresAt: new Date(Date.now() - 1), usedAt: null });
    await expired.svc.webhook('bot', 'sekret', update('/start abcdefgh12345678') as any);
    expect(expired.prisma.telegramLink.upsert).not.toHaveBeenCalled();
    expect(expired.replies[0]).toContain('expired');

    const other = make({ id: 'k', companyId: 'other', memberKey: 'customer:c1', expiresAt: new Date(Date.now() + 60_000), usedAt: null });
    await other.svc.webhook('bot', 'sekret', update('/start abcdefgh12345678') as any);
    expect(other.prisma.telegramLink.upsert).not.toHaveBeenCalled();
  });

  it("an unlinked chat's messages go nowhere", async () => {
    const { svc, replies } = make(null);
    await svc.webhook('bot', 'sekret', update('hello?') as any);
    expect(replies[0]).toContain("isn't connected yet");
  });
});

describe('office alerts: rules', () => {
  it('reads saved settings safely', () => {
    expect(officePrefs(null)).toEqual({ alertScope: 'all', quietFrom: null, quietTo: null });
    expect(officePrefs({ alertScope: 'mine', quietFrom: '20:00', quietTo: '7am' })).toEqual({ alertScope: 'mine', quietFrom: '20:00', quietTo: null });
  });

  it('quiet hours, including across midnight', () => {
    const night = { quietFrom: '20:00', quietTo: '07:00' };
    expect(inQuietHours(night, 21 * 60)).toBe(true);
    expect(inQuietHours(night, 6 * 60 + 59)).toBe(true);
    expect(inQuietHours(night, 7 * 60)).toBe(false);
    expect(inQuietHours(night, 12 * 60)).toBe(false);
    expect(inQuietHours({ quietFrom: '12:00', quietTo: '13:00' }, 12 * 60 + 30)).toBe(true);
    expect(inQuietHours({ quietFrom: null, quietTo: null }, 0)).toBe(false);
  });

  it('says who wrote, about what, and how to answer', () => {
    expect(officeAlertText({ senderName: 'Ann Lee', who: 'customer', jobNumber: 'JOB-12', body: 'Is 3pm ok?', attachments: 0 }))
      .toBe('💬 <b>Ann Lee</b> <i>· customer</i>\n<i>About JOB-12</i>\nIs 3pm ok?\n<i>Reply to this message to answer Ann.</i>');
  });
});

describe('office alerts: who gets one', () => {
  function make(o: { viewing?: boolean; replied?: boolean; prefs?: any } = {}) {
    const sent: any[] = [];
    const prisma: any = {
      telegramLink: { findMany: jest.fn(async () => [
        { id: 'l-admin', chatId: '100', userId: 'u-admin', memberKind: 'STAFF', prefs: o.prefs ?? null },
        { id: 'l-tech', chatId: '200', userId: 'u-tech', memberKind: 'STAFF', prefs: null },
      ]), update: jest.fn() },
      telegramDelivery: { upsert: jest.fn(async () => ({})) },
      chatMessage: { findFirst: jest.fn(async () => (o.replied ? { id: 'x' } : null)) },
    };
    const telegram: any = {
      liveBot: jest.fn(async () => ({ id: 'bot', officeAlerts: true })),
      staffRoles: jest.fn(async () => new Map([['u-admin', 'company_admin'], ['u-tech', 'technician']])),
      send: jest.fn(async (_b: any, chatId: string, text: string) => { sent.push({ chatId, text }); return { message_id: 77 }; }),
    };
    const relay = new TelegramRelay(new ChatBus(), prisma, telegram, {} as any, { isViewing: async () => !!o.viewing } as any, { getSettings: async () => ({ timezone: 'UTC' }) } as any);
    return { relay, sent, prisma };
  }
  const conv = { id: 'cv', companyId: 'co', kind: 'CUSTOMER_OFFICE', lastSeq: 1, members: [{ memberKey: 'office' }, { memberKey: 'customer:c1' }] } as any;
  const msg = (o: any = {}) => ({ id: 'm1', senderKind: 'CUSTOMER', senderMemberKey: 'customer:c1', senderName: 'Ann Lee', body: 'Is 3pm ok?', attachments: null, jobNumber: null, deletedAt: null, ...o }) as any;

  it('alerts linked office staff only (not technicians), and remembers the alert for replies', async () => {
    const { relay, sent, prisma } = make();
    await relay.officeAlerts(conv, msg());
    expect(sent.map((x) => x.chatId)).toEqual(['100']);
    expect(prisma.telegramDelivery.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ linkId: 'l-admin', tgMessageId: 77, status: 'alert' }) }));
  });

  it('no alert for office replies, while someone in the office is reading it, or twice in a minute', async () => {
    const a = make();
    await a.relay.officeAlerts(conv, msg({ senderMemberKey: 'office', senderKind: 'STAFF' }));
    expect(a.sent).toEqual([]);
    const b = make({ viewing: true });
    await b.relay.officeAlerts(conv, msg());
    expect(b.sent).toEqual([]);
    const c = make();
    await c.relay.officeAlerts(conv, msg());
    await c.relay.officeAlerts(conv, msg({ id: 'm2' }));
    expect(c.sent).toHaveLength(1);
  });

  it('"only conversations I replied in" means exactly that', async () => {
    const no = make({ prefs: { alertScope: 'mine' }, replied: false });
    await no.relay.officeAlerts(conv, msg());
    expect(no.sent).toEqual([]);
    const yes = make({ prefs: { alertScope: 'mine' }, replied: true });
    await yes.relay.officeAlerts(conv, msg());
    expect(yes.sent).toHaveLength(1);
  });
});

describe('office staff answering from Telegram', () => {
  function make(replyTo?: number) {
    const replies: string[] = [];
    const link = { id: 'l-admin', botId: 'bot', chatId: '100', memberKind: 'STAFF', memberKey: 'u-admin', userId: 'u-admin', customerId: null, name: 'Rae', unlinkedAt: null };
    const prisma: any = {
      telegramBot: { findUnique: jest.fn(async () => ({ id: 'bot', companyId: 'co', webhookSecret: 's', enabled: true })) },
      telegramLink: { findUnique: jest.fn(async () => link) },
      telegramDelivery: { findFirst: jest.fn(async ({ where }: any) => (where.tgMessageId === 77 ? { messageId: 'm1' } : null)) },
      chatMessage: { findUnique: jest.fn(async () => ({ conversationId: 'cv-ann' })) },
    };
    const chat: any = { visible: jest.fn(async () => ({})), send: jest.fn(async () => ({})) };
    const dir: any = { companyName: async () => 'Orrix', staff: async () => ({ id: 'u-admin', name: 'Rae', role: 'company_admin' }) };
    const svc = new TelegramService(prisma, chat, dir, {} as any, {} as any);
    jest.spyOn(svc, 'liveBot').mockResolvedValue({ id: 'bot' } as any);
    jest.spyOn(svc, 'send').mockImplementation(async (_b: any, _c: string, t: string) => { replies.push(t); return { message_id: 1 } as any; });
    const update = { update_id: 9, message: { message_id: 5, chat: { id: 100, type: 'private' }, date: 0, text: 'Yes, 3pm is fine', ...(replyTo ? { reply_to_message: { message_id: replyTo } } : {}) } };
    return { svc, chat, replies, update };
  }

  it('a Reply to an alert answers in that conversation, as them', async () => {
    const { svc, chat, update } = make(77);
    await svc.webhook('bot', 's', update as any);
    expect(chat.send).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u-admin', role: 'company_admin', name: 'Rae' }), 'cv-ann', { body: 'Yes, 3pm is fine', clientId: 'tg:100:5' });
  });

  it('a message that is not a Reply explains how to answer', async () => {
    const { svc, chat, replies, update } = make();
    await svc.webhook('bot', 's', update as any);
    expect(chat.send).not.toHaveBeenCalled();
    expect(replies[0]).toContain('Reply');
  });
});
