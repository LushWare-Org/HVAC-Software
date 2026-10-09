/**
 * In-app chat between the office, technicians and customers.
 *
 * Every read goes through canView and every write through canPost (chat.policy),
 * so the access rule lives in one place. A conversation someone may not see is
 * reported as not found, never as forbidden, so ids reveal nothing.
 */
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type ConversationKind } from '../prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { ChatBus, type ConvRef, type ShapedMessage } from './chat.bus';
import { ChatDirectory } from './chat.directory';
import {
  OFFICE_KEY, canPost, canView, customerKey, isCustomer, isMine, isOffice, isTechnician, memberKeyFor, type Viewer,
} from './chat.policy';

export const MAX_BODY = 4000;

/**
 * Raw SQL must name the schema: the pooled (pgbouncer) connection doesn't carry
 * Prisma's search_path, so a bare "ChatMember" isn't found there.
 */
const SCHEMA = (() => {
  try {
    const name = new URL(process.env.COMMS_DATABASE_URL ?? '').searchParams.get('schema') || 'comms';
    return /^[a-z_][a-z0-9_]*$/i.test(name) ? name : 'comms';
  } catch {
    return 'comms';
  }
})();
const T = (table: string) => `"${SCHEMA}"."${table}"`;
const EDIT_WINDOW_MS = 15 * 60 * 1000;
const SHARED: ConversationKind[] = ['CUSTOMER_OFFICE', 'TECH_OFFICE'];
const CUSTOMER_KINDS: ConversationKind[] = ['CUSTOMER_OFFICE', 'CUSTOMER_TECH'];

export interface Attachment { url: string; name?: string; type?: string; size?: number }

export interface SendInput {
  body: string;
  clientId?: string;
  jobId?: string;
  attachments?: Attachment[];
  /** Staff only: "kelvin" when Kelvin sends on their behalf. */
  via?: 'kelvin';
}

type MemberSeed = Prisma.ChatMemberCreateWithoutConversationInput;
type Conv = Prisma.ConversationGetPayload<{ include: { members: true } }>;

const preview = (body: string, attachments?: Attachment[]) =>
  (body.trim() || (attachments?.length ? `📎 ${attachments.length === 1 ? 'Attachment' : `${attachments.length} attachments`}` : '')).slice(0, 140);

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dir: ChatDirectory,
    private readonly bus: ChatBus,
  ) {}

  // ── Loading and access ──────────────────────────────────────────────────

  private async load(id: string): Promise<Conv | null> {
    return this.prisma.conversation.findUnique({ where: { id }, include: { members: true } });
  }

  /** The conversation, or "not found" when this person may not see it. */
  async visible(v: Viewer, id: string): Promise<Conv> {
    const conv = await this.load(id);
    if (!conv || !canView(v, conv)) throw new NotFoundException('Conversation not found');
    return conv;
  }

  // ── Opening conversations (get-or-create, one per pair) ─────────────────

  private async openPair(companyId: string, pairKey: string, kind: ConversationKind, seed: {
    customerId?: string; customerName?: string; title?: string; createdById?: string; members: MemberSeed[];
  }): Promise<Conv> {
    const conv = await this.prisma.conversation.upsert({
      where: { companyId_pairKey: { companyId, pairKey } },
      create: {
        companyId, pairKey, kind, customerId: seed.customerId, customerName: seed.customerName,
        title: seed.title, createdById: seed.createdById, members: { create: seed.members },
      },
      update: {},
      include: { members: true },
    });
    // A member who should be there but isn't (e.g. left, or the conversation predates them): put them back.
    // Usually nothing needs fixing, and then the upsert's own result is returned with no extra round trip.
    let changed = false;
    for (const m of seed.members) {
      const have = conv.members.find((x) => x.memberKey === m.memberKey);
      if (!have) {
        await this.prisma.chatMember.create({ data: { ...m, conversationId: conv.id } });
        changed = true;
      } else if (have.leftAt || have.hiddenAt) {
        await this.prisma.chatMember.update({ where: { id: have.id }, data: { leftAt: null, hiddenAt: null } });
        changed = true;
      }
    }
    return changed ? (await this.load(conv.id))! : conv;
  }

  private officeSeat(companyId: string, companyName: string): MemberSeed {
    return { companyId, kind: 'OFFICE', memberKey: OFFICE_KEY, name: companyName };
  }

  private staffSeat(companyId: string, u: { id: string; name: string; role: string }): MemberSeed {
    return { companyId, kind: 'STAFF', memberKey: u.id, userId: u.id, name: u.name, role: u.role };
  }

  private customerSeat(companyId: string, c: { id: string; name: string }): MemberSeed {
    return { companyId, kind: 'CUSTOMER', memberKey: customerKey(c.id), customerId: c.id, name: c.name || 'Customer', role: 'customer' };
  }

  /** The conversation for this pair if it already exists and is complete: one query, no lookups. */
  private async existing(companyId: string, pairKey: string, keys: string[]): Promise<Conv | null> {
    const conv = await this.prisma.conversation.findUnique({ where: { companyId_pairKey: { companyId, pairKey } }, include: { members: true } });
    if (!conv) return null;
    const ok = keys.every((k) => conv.members.some((m) => m.memberKey === k && !m.leftAt && !m.hiddenAt));
    return ok ? conv : null;
  }

  /** A customer and the office. Customers open their own; the office (or a service on its behalf) opens any customer's. */
  async openOffice(v: Viewer, customerId?: string): Promise<Conv> {
    const cid = isCustomer(v) ? v.customerId : customerId;
    if (!cid) throw new BadRequestException('Which customer?');
    if (!isCustomer(v) && !isOffice(v)) throw new ForbiddenException('Only the office can open a customer conversation');
    const found = await this.existing(v.companyId, `office|${cid}`, [OFFICE_KEY, customerKey(cid)]);
    if (found) return found;
    const [customer, companyName] = await Promise.all([this.dir.customer(v.companyId, cid), this.dir.companyName(v.companyId)]);
    if (!customer) throw new NotFoundException('Customer not found');
    return this.openPair(v.companyId, `office|${cid}`, 'CUSTOMER_OFFICE', {
      customerId: cid, customerName: customer.name, createdById: v.userId,
      members: [this.officeSeat(v.companyId, companyName), this.customerSeat(v.companyId, customer)],
    });
  }

  /** A customer and one technician who has worked for them. Private to the two of them. */
  async openCustomerTech(v: Viewer, other: { techUserId?: string; customerId?: string }): Promise<Conv> {
    let techId: string | undefined, cid: string | undefined;
    if (isCustomer(v)) { techId = other.techUserId; cid = v.customerId ?? undefined; }
    else if (isTechnician(v)) { techId = v.userId; cid = other.customerId; }
    else throw new ForbiddenException('Customer and technician chats are between those two people');
    if (!techId || !cid) throw new BadRequestException('Who is the conversation with?');
    // Already chatting: the right to chat was checked when it was opened.
    const found = await this.existing(v.companyId, `tech|${techId}|${cid}`, [techId, customerKey(cid)]);
    if (found) return found;
    const [tech, customer, served] = await Promise.all([
      this.dir.staff(v.companyId, techId), this.dir.customer(v.companyId, cid), this.dir.techServedCustomer(v.companyId, techId, cid),
    ]);
    if (!tech || tech.role !== 'technician') throw new NotFoundException('Technician not found');
    if (!customer) throw new NotFoundException('Customer not found');
    if (!served) {
      throw new ForbiddenException(`${tech.name} hasn't worked on a visit for this customer`);
    }
    return this.openPair(v.companyId, `tech|${techId}|${cid}`, 'CUSTOMER_TECH', {
      customerId: cid, customerName: customer.name, createdById: v.userId,
      members: [this.staffSeat(v.companyId, tech), this.customerSeat(v.companyId, customer)],
    });
  }

  /** A technician and the office. Technicians open their own; the office opens any technician's. */
  async openTechOffice(v: Viewer, techUserId?: string): Promise<Conv> {
    const techId = isTechnician(v) ? v.userId : techUserId;
    if (!isTechnician(v) && !isOffice(v)) throw new ForbiddenException('Only technicians and the office use this');
    if (!techId) throw new BadRequestException('Which technician?');
    const found = await this.existing(v.companyId, `techoffice|${techId}`, [OFFICE_KEY, techId]);
    if (found) return found;
    const [tech, companyName] = await Promise.all([this.dir.staff(v.companyId, techId), this.dir.companyName(v.companyId)]);
    if (!tech || tech.role !== 'technician') throw new NotFoundException('Technician not found');
    return this.openPair(v.companyId, `techoffice|${techId}`, 'TECH_OFFICE', {
      title: tech.name, createdById: v.userId,
      members: [this.officeSeat(v.companyId, companyName), this.staffSeat(v.companyId, tech)],
    });
  }

  /** Two staff members. */
  async openDirect(v: Viewer, otherUserId: string): Promise<Conv> {
    if (isCustomer(v)) throw new ForbiddenException('Customers message the office or their technician');
    if (!otherUserId || otherUserId === v.userId) throw new BadRequestException('Choose someone else to message');
    const pairIds = [v.userId, otherUserId].sort();
    const found = await this.existing(v.companyId, `dm|${pairIds[0]}|${pairIds[1]}`, pairIds);
    if (found) return found;
    const [me, other] = await Promise.all([this.dir.staff(v.companyId, v.userId), this.dir.staff(v.companyId, otherUserId)]);
    if (!other) throw new NotFoundException('Team member not found');
    const self = me ?? { id: v.userId, name: v.name, role: v.role };
    const pair = [v.userId, otherUserId].sort();
    return this.openPair(v.companyId, `dm|${pair[0]}|${pair[1]}`, 'STAFF_DIRECT', {
      createdById: v.userId, members: [this.staffSeat(v.companyId, self), this.staffSeat(v.companyId, other)],
    });
  }

  /** Several staff members, e.g. a job's crew and the dispatcher. */
  async createGroup(v: Viewer, userIds: string[], title: string): Promise<Conv> {
    if (isCustomer(v)) throw new ForbiddenException('Customers message the office or their technician');
    const name = String(title ?? '').trim().slice(0, 80);
    if (!name) throw new BadRequestException('Give the group a name');
    const ids = [...new Set([v.userId, ...(userIds ?? [])])];
    if (ids.length < 3) throw new BadRequestException('A group needs at least three people; message one person directly instead');
    if (ids.length > 50) throw new BadRequestException('Groups are limited to 50 people');
    const people = await Promise.all(ids.map((id) => this.dir.staff(v.companyId, id)));
    const missing = ids.filter((id, i) => !people[i] && id !== v.userId);
    if (missing.length) throw new NotFoundException('Some of those people are not on the team');
    const members = ids.map((id, i) => this.staffSeat(v.companyId, people[i] ?? { id: v.userId, name: v.name, role: v.role }));
    const conv = await this.prisma.conversation.create({
      data: { companyId: v.companyId, kind: 'STAFF_GROUP', title: name, createdById: v.userId, members: { create: members } },
      include: { members: true },
    });
    this.bus.publish({ type: 'conversation', conv: this.ref(conv) });
    return conv;
  }

  // ── Reading ─────────────────────────────────────────────────────────────

  /** What a list shows: conversations this person can see, newest first, with their own unread counts. */
  async list(v: Viewer, opts: { q?: string; archived?: boolean; page?: number; limit?: number } = {}) {
    const limit = Math.min(Math.max(Number(opts.limit) || 30, 1), 100);
    const page = Math.max(Number(opts.page) || 1, 1);
    const where = this.visibleWhere(v, opts);
    const [rows, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where, include: { members: true },
        orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);
    const unread = await this.unreadFor(v, rows.map((r) => r.id));
    const companyName = await this.dir.companyName(v.companyId);
    return { data: rows.map((c) => this.summary(v, c, unread.get(c.id) ?? 0, companyName)), total, page, limit };
  }

  private visibleWhere(v: Viewer, opts: { q?: string; archived?: boolean }): Prisma.ConversationWhereInput {
    const mine = (key: string): Prisma.ConversationWhereInput => ({ members: { some: { memberKey: key, leftAt: null, hiddenAt: null } } });
    let base: Prisma.ConversationWhereInput;
    if (isCustomer(v)) {
      base = { companyId: v.companyId, customerId: v.customerId ?? '__none__', kind: { in: CUSTOMER_KINDS }, ...mine(customerKey(v.customerId ?? '')) };
    } else if (isOffice(v)) {
      base = { companyId: v.companyId, OR: [{ kind: { in: SHARED } }, mine(v.userId)] };
    } else {
      base = { companyId: v.companyId, ...mine(v.userId) };
    }
    const and: Prisma.ConversationWhereInput[] = [base];
    if (!isCustomer(v)) and.push(opts.archived ? { archivedAt: { not: null } } : { archivedAt: null });
    const q = String(opts.q ?? '').trim();
    if (q) {
      and.push({ OR: [
        { customerName: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { members: { some: { name: { contains: q, mode: 'insensitive' } } } },
        { messages: { some: { body: { contains: q, mode: 'insensitive' }, deletedAt: null } } },
      ] });
    }
    return { AND: and };
  }

  /** One conversation with its latest messages and who has read how far. */
  async detail(v: Viewer, idOrConv: string | Conv, limit = 50) {
    const conv = typeof idOrConv === 'string' ? await this.visible(v, idOrConv) : idOrConv;
    if (!canView(v, conv)) throw new NotFoundException('Conversation not found');
    const [messages, unread, companyName, telegram] = await Promise.all([
      this.page(conv, undefined, limit),
      this.unreadFor(v, [conv.id]),
      this.dir.companyName(v.companyId),
      this.telegramFor(v, conv, limit),
    ]);
    const me = memberKeyFor(v, conv);
    return {
      ...this.summary(v, conv, unread.get(conv.id) ?? 0, companyName),
      members: conv.members.filter((m) => !m.leftAt).map((m) => ({
        memberKey: m.memberKey, kind: m.kind, name: m.name, role: m.role, lastReadSeq: m.lastReadSeq, isMe: m.memberKey === me,
        onTelegram: telegram.linked.has(m.memberKey),
      })),
      messages: messages.map((m) => ({ ...m, mine: isMine(v, conv, m), telegram: telegram.sent.get(m.id) ?? null })),
      hasMore: messages.length > 0 && messages[0].seq > 1,
    };
  }

  /**
   * Staff only: who in this conversation also gets it on Telegram, and whether
   * the latest messages reached them there. Customers don't need to see this.
   */
  private async telegramFor(v: Viewer, conv: Conv, limit: number) {
    const none = { linked: new Set<string>(), sent: new Map<string, 'sent' | 'failed'>() };
    if (isCustomer(v)) return none;
    const keys = conv.members.filter((m) => !m.leftAt && m.memberKey !== OFFICE_KEY).map((m) => m.memberKey);
    const rows = await this.prisma.$queryRawUnsafe<Array<{ memberKey: string | null; messageId: string | null; status: string | null }>>(
      `SELECT l."memberKey", NULL AS "messageId", NULL AS status
         FROM ${T('TelegramLink')} l JOIN ${T('TelegramBot')} b ON b.id = l."botId" AND b.enabled
        WHERE l."companyId" = $1 AND l."memberKey" = ANY($2::text[]) AND l."unlinkedAt" IS NULL
       UNION ALL
       SELECT NULL, d."messageId", d.status
         FROM ${T('TelegramDelivery')} d JOIN ${T('ChatMessage')} m ON m.id = d."messageId"
        WHERE m."conversationId" = $3 AND m.seq > $4 AND d.status IN ('sent', 'failed')`,
      conv.companyId, keys, conv.id, conv.lastSeq - Math.min(Math.max(limit, 1), 100),
    ).catch(() => []); // before the Telegram tables exist, chat still works
    for (const r of rows) {
      if (r.memberKey) none.linked.add(r.memberKey);
      else if (r.messageId) none.sent.set(r.messageId, none.sent.get(r.messageId) === 'sent' || r.status === 'sent' ? 'sent' : 'failed');
    }
    return none;
  }

  /** Older messages, for scrolling back. */
  async messages(v: Viewer, id: string, beforeSeq?: number, limit = 50) {
    const conv = await this.visible(v, id);
    const rows = await this.page(conv, beforeSeq, limit);
    return { data: rows.map((m) => ({ ...m, mine: isMine(v, conv, m) })), hasMore: rows.length > 0 && rows[0].seq > 1 };
  }

  private async page(conv: Conv, beforeSeq: number | undefined, limit: number): Promise<ShapedMessage[]> {
    const take = Math.min(Math.max(limit, 1), 100);
    const rows = await this.prisma.chatMessage.findMany({
      where: { conversationId: conv.id, ...(beforeSeq ? { seq: { lt: beforeSeq } } : {}) },
      orderBy: { seq: 'desc' }, take,
    });
    return rows.reverse().map((m) => this.shape(m));
  }

  // ── Sending ─────────────────────────────────────────────────────────────

  async send(v: Viewer, id: string, input: SendInput): Promise<ShapedMessage & { mine: true }> {
    const conv = await this.visible(v, id);
    if (!canPost(v, conv)) throw new ForbiddenException('This conversation is archived');
    const body = String(input.body ?? '').trim();
    const attachments = (input.attachments ?? []).slice(0, 10).filter((a) => /^https:\/\//i.test(String(a?.url ?? '')));
    if (!body && !attachments.length) throw new BadRequestException('Write a message first');
    if (body.length > MAX_BODY) throw new BadRequestException(`Keep messages under ${MAX_BODY} characters`);
    const clientId = input.clientId ? String(input.clientId).slice(0, 64) : null;

    let job: { id: string; jobNumber: string; customerId: string | null } | null = null;
    if (input.jobId) {
      job = await this.dir.job(v.companyId, input.jobId);
      if (!job || (conv.customerId && job.customerId !== conv.customerId)) throw new BadRequestException("That job isn't this customer's");
    }

    const senderMemberKey = memberKeyFor(v, conv);
    const sender = await this.sender(v, input.via);
    const now = new Date();
    // One statement, so it's atomic and a single round trip: number the message, save it,
    // mark it read for the sender, and bring the conversation back for anyone who hid it.
    // A retry with the same client id inserts nothing and gets the original back.
    const rows = await this.prisma.$queryRawUnsafe<Array<Prisma.ChatMessageGetPayload<object>>>(
      `WITH c AS (
         UPDATE ${T('Conversation')}
            SET "lastSeq" = "lastSeq" + 1, "lastMessageAt" = $3, "lastMessagePreview" = $4, "lastSenderName" = $5, "updatedAt" = $3
          WHERE id = $1
          RETURNING id, "lastSeq"
       ), m AS (
         INSERT INTO ${T('ChatMessage')}
           (id, "conversationId", "companyId", seq, "senderKind", "senderMemberKey", "senderUserId", "senderName", "senderRole",
            body, attachments, "jobId", "jobNumber", "clientId", "createdAt")
         SELECT gen_random_uuid()::text, c.id, $2, c."lastSeq", $6::${T('ChatSenderKind')}, $7, $8, $5, $9,
                $10, $11::jsonb, $12, $13, $14, $3
           FROM c
         ON CONFLICT ("conversationId", "clientId") DO NOTHING
         RETURNING *
       ), r AS (
         UPDATE ${T('ChatMember')} mb SET "lastReadSeq" = m.seq, "lastReadAt" = $3
           FROM m WHERE mb."conversationId" = m."conversationId" AND mb."memberKey" = m."senderMemberKey"
       ), u AS (
         UPDATE ${T('ChatMember')} SET "hiddenAt" = NULL
          WHERE "conversationId" = $1 AND "hiddenAt" IS NOT NULL AND EXISTS (SELECT 1 FROM m)
       )
       SELECT * FROM m`,
      conv.id, conv.companyId, now, preview(body, attachments), sender.name, sender.kind, senderMemberKey, v.userId, v.role,
      body, attachments.length ? JSON.stringify(attachments) : null, job?.id ?? null, job?.jobNumber ?? null, clientId,
    );
    if (!rows.length) {
      const dup = clientId ? await this.prisma.chatMessage.findUnique({ where: { conversationId_clientId: { conversationId: conv.id, clientId } } }) : null;
      if (dup) return { ...this.shape(dup), mine: true };
      throw new BadRequestException('The message could not be saved. Try again.');
    }
    const created = rows[0];

    const shaped = this.shape(created);
    this.bus.publish({ type: 'message', conv: { ...this.ref(conv), lastSeq: created.seq }, message: shaped });
    return { ...shaped, mine: true };
  }

  /** How the sender appears. Kelvin and our own services post as themselves, on the company's behalf. */
  private async sender(v: Viewer, via?: string): Promise<{ kind: 'STAFF' | 'CUSTOMER' | 'SYSTEM' | 'KELVIN'; name: string }> {
    if (isCustomer(v)) return { kind: 'CUSTOMER', name: v.name || 'Customer' };
    if (v.userId.startsWith('system-')) return { kind: 'SYSTEM', name: await this.dir.companyName(v.companyId) };
    if (via === 'kelvin') return { kind: 'KELVIN', name: 'Kelvin' };
    return { kind: 'STAFF', name: v.name || 'Team member' };
  }

  // ── Read, mute, hide, archive ───────────────────────────────────────────

  async markRead(v: Viewer, id: string, seq?: number) {
    const conv = await this.visible(v, id);
    const key = memberKeyFor(v, conv);
    const upTo = Math.min(Number.isFinite(Number(seq)) && Number(seq) > 0 ? Number(seq) : conv.lastSeq, conv.lastSeq);
    const res = await this.prisma.chatMember.updateMany({
      where: { conversationId: conv.id, memberKey: key, lastReadSeq: { lt: upTo } },
      data: { lastReadSeq: upTo, lastReadAt: new Date() },
    });
    if (res.count) this.bus.publish({ type: 'read', conv: this.ref(conv), memberKey: key, seq: upTo });
    return { conversationId: conv.id, lastReadSeq: upTo };
  }

  async mute(v: Viewer, id: string, until: string | null) {
    const conv = await this.visible(v, id);
    const at = until ? new Date(until) : null;
    if (at && Number.isNaN(at.getTime())) throw new BadRequestException('That date is not valid');
    await this.prisma.chatMember.updateMany({ where: { conversationId: conv.id, memberKey: memberKeyFor(v, conv) }, data: { mutedUntil: at } });
    return { conversationId: conv.id, mutedUntil: at };
  }

  /** Hides it from this person's list only. Nobody else's history changes; a new message brings it back. */
  async hide(v: Viewer, id: string) {
    const conv = await this.visible(v, id);
    const key = memberKeyFor(v, conv);
    if (key === OFFICE_KEY) throw new BadRequestException('Archive shared office conversations instead');
    await this.prisma.chatMember.updateMany({ where: { conversationId: conv.id, memberKey: key }, data: { hiddenAt: new Date() } });
    return { conversationId: conv.id, hidden: true };
  }

  /** The office archives a shared-inbox conversation (and staff archive their own chats). Read-only until restored. */
  async archive(v: Viewer, id: string, archived: boolean) {
    const conv = await this.visible(v, id);
    if (isCustomer(v)) throw new ForbiddenException('Customers can hide a conversation instead');
    if (SHARED.includes(conv.kind) && !isOffice(v)) throw new ForbiddenException('Only the office can archive this');
    const updated = await this.prisma.conversation.update({ where: { id: conv.id }, data: { archivedAt: archived ? new Date() : null }, include: { members: true } });
    this.bus.publish({ type: 'conversation', conv: this.ref(updated) });
    return { conversationId: conv.id, archived };
  }

  // ── Editing your own messages ───────────────────────────────────────────

  private async ownMessage(v: Viewer, messageId: string) {
    const msg = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Message not found');
    const conv = await this.visible(v, msg.conversationId);
    // Your own message: in a shared inbox that means one you sent yourself, not a colleague's.
    if (msg.senderUserId !== v.userId || !isMine(v, conv, msg)) throw new ForbiddenException('You can only change your own messages');
    if (msg.deletedAt) throw new BadRequestException('That message was deleted');
    if (Date.now() - msg.createdAt.getTime() > EDIT_WINDOW_MS) throw new BadRequestException('Messages can only be changed for 15 minutes after sending');
    return { msg, conv };
  }

  async edit(v: Viewer, messageId: string, body: string) {
    const text = String(body ?? '').trim();
    if (!text) throw new BadRequestException('The message is empty. Delete it instead');
    if (text.length > MAX_BODY) throw new BadRequestException(`Keep messages under ${MAX_BODY} characters`);
    const { msg, conv } = await this.ownMessage(v, messageId);
    const updated = await this.prisma.chatMessage.update({ where: { id: msg.id }, data: { body: text, editedAt: new Date() } });
    const shaped = this.shape(updated);
    this.bus.publish({ type: 'message_updated', conv: this.ref(conv), message: shaped });
    return { ...shaped, mine: true };
  }

  async remove(v: Viewer, messageId: string) {
    const { msg, conv } = await this.ownMessage(v, messageId);
    const updated = await this.prisma.chatMessage.update({ where: { id: msg.id }, data: { body: '', attachments: Prisma.DbNull, deletedAt: new Date() } });
    const shaped = this.shape(updated);
    this.bus.publish({ type: 'message_updated', conv: this.ref(conv), message: shaped });
    return { ...shaped, mine: true };
  }

  // ── Unread ──────────────────────────────────────────────────────────────

  /** Badges: unread per conversation and in total (muted ones don't add to the total). */
  async unreadSummary(v: Viewer) {
    const rows = await this.unreadRows(v);
    const byConversation: Record<string, number> = {};
    let total = 0;
    for (const r of rows) {
      byConversation[r.id] = r.n;
      if (!r.muted) total += r.n;
    }
    return { total, byConversation };
  }

  /**
   * Per conversation: messages after my read marker that someone else sent.
   * Pass ids to count only those (a list page, one open conversation) instead of everything.
   */
  private async unreadRows(v: Viewer, ids?: string[]): Promise<Array<{ id: string; n: number; muted: boolean }>> {
    const params: unknown[] = [v.companyId, this.myKeys(v)];
    let extra = '';
    if (isCustomer(v)) { params.push(v.customerId); extra += ` AND c."customerId" = $${params.length}`; }
    if (ids) { params.push(ids); extra += ` AND c.id = ANY($${params.length}::text[])`; }
    return this.prisma.$queryRawUnsafe<Array<{ id: string; n: number; muted: boolean }>>(
      `SELECT c.id, COUNT(m.id)::int AS n, BOOL_OR(mb."mutedUntil" IS NOT NULL AND mb."mutedUntil" > NOW()) AS muted
         FROM ${T('ChatMember')} mb
         JOIN ${T('Conversation')} c ON c.id = mb."conversationId" AND c."companyId" = $1 AND c."archivedAt" IS NULL
         JOIN ${T('ChatMessage')} m ON m."conversationId" = c.id AND m.seq > mb."lastReadSeq"
                              AND m."senderMemberKey" <> mb."memberKey" AND m."deletedAt" IS NULL
        WHERE mb."companyId" = $1 AND mb."memberKey" = ANY($2::text[]) AND mb."leftAt" IS NULL AND mb."hiddenAt" IS NULL${extra}
        GROUP BY c.id`,
      ...params,
    );
  }

  private myKeys(v: Viewer): string[] {
    if (isCustomer(v)) return [customerKey(v.customerId ?? '')];
    return isOffice(v) ? [v.userId, OFFICE_KEY] : [v.userId];
  }

  private async unreadFor(v: Viewer, ids: string[]): Promise<Map<string, number>> {
    const out = new Map<string, number>();
    if (!ids.length) return out;
    for (const r of await this.unreadRows(v, ids)) out.set(r.id, r.n);
    return out;
  }

  // ── Shapes ──────────────────────────────────────────────────────────────

  /** How a conversation is named and described for this viewer. */
  summary(v: Viewer, c: Conv, unread: number, companyName: string) {
    const me = memberKeyFor(v, c);
    const others = c.members.filter((m) => m.memberKey !== me && !m.leftAt);
    let title: string;
    let subtitle: string;
    switch (c.kind) {
      case 'CUSTOMER_OFFICE':
        title = isCustomer(v) ? companyName : c.customerName ?? 'Customer';
        subtitle = isCustomer(v) ? 'Office' : 'Customer';
        break;
      case 'CUSTOMER_TECH':
        title = isCustomer(v) ? others.find((m) => m.kind === 'STAFF')?.name ?? 'Technician' : c.customerName ?? 'Customer';
        subtitle = isCustomer(v) ? 'Your technician' : 'Customer';
        break;
      case 'TECH_OFFICE':
        title = isTechnician(v) ? companyName : others.find((m) => m.kind === 'STAFF')?.name ?? c.title ?? 'Technician';
        subtitle = isTechnician(v) ? 'Office' : 'Technician';
        break;
      case 'STAFF_DIRECT':
        title = others[0]?.name ?? 'Team member';
        subtitle = (others[0]?.role ?? 'team').replace(/_/g, ' ');
        break;
      default:
        title = c.title ?? others.map((m) => m.name).join(', ');
        subtitle = `${c.members.filter((m) => !m.leftAt).length} people`;
    }
    const mine = c.members.find((m) => m.memberKey === me);
    // The other staff member in a technician↔office or direct chat.
    const peerUserId = c.kind === 'TECH_OFFICE' || c.kind === 'STAFF_DIRECT' || c.kind === 'CUSTOMER_TECH'
      ? others.find((m) => m.kind === 'STAFF')?.userId ?? null : null;
    return {
      id: c.id, kind: c.kind, title, subtitle, customerId: c.customerId, peerUserId,
      myMemberKey: me, unread, lastSeq: c.lastSeq,
      lastMessageAt: c.lastMessageAt, lastMessagePreview: c.lastMessagePreview, lastSenderName: c.lastSenderName,
      muted: !!(mine?.mutedUntil && mine.mutedUntil > new Date()), archived: !!c.archivedAt,
      createdAt: c.createdAt,
    };
  }

  private shape(m: Prisma.ChatMessageGetPayload<object>): ShapedMessage {
    return {
      id: m.id, conversationId: m.conversationId, seq: m.seq, senderKind: m.senderKind, senderMemberKey: m.senderMemberKey,
      senderUserId: m.senderUserId, senderName: m.senderName, senderRole: m.senderRole,
      body: m.deletedAt ? '' : m.body, attachments: m.deletedAt ? null : m.attachments,
      jobId: m.jobId, jobNumber: m.jobNumber, clientId: m.clientId, editedAt: m.editedAt, deletedAt: m.deletedAt, createdAt: m.createdAt,
    };
  }

  ref(c: Conv): ConvRef {
    return { id: c.id, companyId: c.companyId, kind: c.kind, customerId: c.customerId, title: c.title, customerName: c.customerName, lastSeq: c.lastSeq, members: c.members };
  }
}
