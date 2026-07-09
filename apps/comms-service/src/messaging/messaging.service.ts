/**
 * MessagingService — Two-way conversation threads between company staff and customers.
 *
 * Architecture:
 *  - Outbound: Staff sends message via REST → stored as Message row → Twilio delivers
 *  - Inbound:  Twilio webhook → match thread by customer phone → insert Message row
 *
 * PostgreSQL relational model (migrated from MongoDB embedded documents):
 *  - MessageThread — thread metadata, participant info, last message cache
 *  - Message — individual messages, FK to MessageThread (onDelete: Cascade)
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { EmailService } from '../email/email.service';
import { CreateThreadDto, SendMessageDto, TwilioInboundWebhookDto } from './dto/messaging.dto';
import { MessageDirection, ThreadStatus, Channel } from '../prisma/generated';

const MESSAGES_INCLUDE = {
  messages: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  // ── Threads ───────────────────────────────────────────────────────────────

  async createThread(companyId: string, dto: CreateThreadDto, creatorId?: string) {
    const isCustomerThread = !!dto.customerId;

    if (isCustomerThread) {
      // Reuse an existing thread only when the same context is being opened:
      //   - same customer + same job, OR
      //   - same customer + same subject (lets "Chat with Technician: X" coexist with "Support Request")
      // If the caller provides neither jobId nor subject we fall back to the default
      // "Support" thread for that customer.
      const existing = await this.prisma.messageThread.findFirst({
        where: {
          companyId,
          customerId: dto.customerId,
          status: ThreadStatus.ACTIVE,
          ...(dto.jobId
            ? { jobId: dto.jobId }
            : dto.subject
              ? { subject: dto.subject, jobId: null }
              : { jobId: null, OR: [{ subject: null }, { subject: '' }] }),
        },
        include: MESSAGES_INCLUDE,
      });
      if (existing) return this.enrichThread(existing);
    } else if (dto.participantIds?.length) {
      const allParticipants = creatorId
        ? [...new Set([creatorId, ...dto.participantIds])].sort()
        : [...dto.participantIds].sort();

      const existing = await this.prisma.messageThread.findFirst({
        where: {
          companyId,
          status: ThreadStatus.ACTIVE,
          participantIds: { equals: allParticipants },
        },
        include: MESSAGES_INCLUDE,
      });
      if (existing) return this.enrichThread(existing);

      const thread = await this.prisma.messageThread.create({
        data: {
          companyId,
          participantIds: allParticipants,
          participantNames: dto.participantNames ?? [],
          subject: dto.subject,
          jobId: dto.jobId,
        },
        include: MESSAGES_INCLUDE,
      });
      return this.enrichThread(thread);
    }

    const thread = await this.prisma.messageThread.create({
      data: {
        companyId,
        customerId: dto.customerId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail,
        participantIds: dto.participantIds ?? [],
        participantNames: dto.participantNames ?? [],
        subject: dto.subject,
        jobId: dto.jobId,
      },
      include: MESSAGES_INCLUDE,
    });
    return this.enrichThread(thread);
  }

  async findThreads(
    companyId: string,
    params: {
      status?: ThreadStatus;
      page?: number;
      limit?: number;
      customerId?: string;
      userId?: string;
    },
  ) {
    const { status, page = 1, limit = 20, customerId, userId } = params;
    const skip = (page - 1) * limit;

    let where: any = {
      companyId,
      ...(status ? { status } : {}),
    };

    if (customerId) {
      // CUSTOMER role: see only their own threads.
      where.customerId = customerId;
    } else if (userId) {
      // Staff / admin: see only threads they are personally part of.
      //
      // Four kinds of threads exist:
      //   A) Admin↔customer (admin created):         customerId set, participantIds = [], subject = null or custom
      //   B) Tech↔customer  (tech-app created):      customerId set, participantIds = [techId], subject = "Tech: X"
      //   C) Customer-initiated tech chat (portal):  customerId set, participantIds = [], subject starts with "Chat with Technician:"
      //   D) Staff-to-staff:                         customerId null, participantIds = [id1, id2, ...]
      //
      // Admins should see:
      //   - A: their own admin↔customer threads (empty participantIds, NOT a tech-chat subject)
      //   - D (only when the admin's userId is in participantIds)
      //   - B / C: ONLY if this admin is explicitly listed in participantIds
      //
      // "Chat with Technician:" threads (C) are customer↔tech private chats — admin must never see them.
      where = {
        companyId,
        ...(status ? { status } : {}),
        OR: [
          // Rule A: admin-created customer thread — no participant list, NOT a customer-initiated tech chat
          {
            customerId: { not: null },
            participantIds: { isEmpty: true },
            // Exclude "Chat with Technician: X" threads started by the customer portal
            OR: [
              { subject: null },
              { subject: { not: { startsWith: 'Chat with Technician:' } } },
            ],
          },
          // Rules B / C / D: explicit participant list — caller must be in it
          { participantIds: { has: userId } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.messageThread.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
        // Omit messages in list view for performance — load on thread open
      }),
      this.prisma.messageThread.count({ where }),
    ]);

    return {
      data: items.map((thread) => this.enrichThread(thread as any)),
      total,
      page,
      limit,
    };
  }

  async findThread(companyId: string, id: string, customerId?: string) {
    const thread = await this.prisma.messageThread.findFirst({
      where: {
        id,
        companyId,
        ...(customerId ? { customerId } : {}),
      },
      include: MESSAGES_INCLUDE,
    });
    if (!thread) throw new NotFoundException(`Thread ${id} not found`);
    return this.enrichThread(thread);
  }

  /**
   * Permanently delete a thread and all its messages.
   * Authorization: caller must be a participant (participantIds contains userId)
   * OR the thread has no explicit participant list (admin-created customer thread).
   * Customers are additionally scoped to their own customerId.
   */
  async deleteThread(
    companyId: string,
    id: string,
    userId?: string,
    customerId?: string,
  ) {
    const thread = await this.prisma.messageThread.findFirst({
      where: {
        id,
        companyId,
        ...(customerId ? { customerId } : {}),
      },
    });
    if (!thread) throw new NotFoundException(`Thread ${id} not found`);

    // Participant check: if participantIds is non-empty, caller must be listed.
    const pids = thread.participantIds ?? [];
    if (pids.length > 0 && userId && !pids.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this thread');
    }

    await this.prisma.messageThread.delete({ where: { id } });
    return { deleted: true, id };
  }

  async updateThreadStatus(companyId: string, id: string, status: ThreadStatus, customerId?: string) {
    await this.findThread(companyId, id, customerId);
    return this.prisma.messageThread.update({
      where: { id },
      data: { status },
      include: MESSAGES_INCLUDE,
    });
  }

  async markThreadRead(companyId: string, id: string, customerId?: string) {
    await this.findThread(companyId, id, customerId);
    return this.prisma.messageThread.update({
      where: { id },
      data: { unreadCount: 0 },
      include: MESSAGES_INCLUDE,
    });
  }

  // ── Messages ──────────────────────────────────────────────────────────────

  async sendMessage(
    companyId: string,
    threadId: string,
    senderId: string,
    senderName: string,
    dto: SendMessageDto,
    senderRole?: string,
    senderCustomerId?: string,
  ) {
    const customerScope = senderRole?.toLowerCase() === 'customer' ? senderCustomerId : undefined;
    const thread = await this.findThread(companyId, threadId, customerScope);

    if (!dto.body?.trim()) {
      throw new BadRequestException('Message body is required');
    }

    const isStaffThread = !thread.customerId && thread.participantIds?.length > 0;
    const customerSender = !isStaffThread && (
      senderRole?.toLowerCase() === 'customer' || senderCustomerId === thread.customerId
    );

    if (customerSender && senderCustomerId && thread.customerId !== senderCustomerId) {
      throw new ForbiddenException('You can only send messages to your own thread');
    }

    const direction = customerSender ? MessageDirection.INBOUND : MessageDirection.OUTBOUND;
    const now = new Date();

    // Create message row + update thread metadata in a single transaction
    await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          id: uuidv4(),
          threadId,
          senderId,
          senderName,
          direction,
          body: dto.body.trim(),
          channel: Channel.IN_APP,
          mediaUrls: dto.mediaUrls ?? [],
          sentAt: now,
          createdAt: now,
        },
      }),
      this.prisma.messageThread.update({
        where: { id: threadId },
        data: {
          lastMessageAt: now,
          lastMessageBody: dto.body.trim().substring(0, 100),
          unreadCount: customerSender || isStaffThread ? { increment: 1 } : 0,
          updatedAt: now,
        },
      }),
    ]);

    // Optional email copy: customers don't sit in the portal all day, so
    // outbound messages flagged with notifyEmail also land in their inbox.
    // Fire-and-forget — an email failure never fails the message itself.
    if (dto.notifyEmail && direction === MessageDirection.OUTBOUND && thread.customerEmail) {
      const subject = dto.emailSubject?.trim() || thread.subject || `New message from ${senderName}`;
      const safeBody = dto.body.trim()
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');
      this.emailService
        .send({
          to: thread.customerEmail,
          toName: thread.customerName ?? undefined,
          subject,
          htmlBody: `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a">
            <p>${safeBody}</p>
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0"/>
            <p style="font-size:12px;color:#888">Sent by ${senderName}. Reply to this email or through your customer portal.</p>
          </div>`,
          textBody: dto.body.trim(),
        })
        .then(r => {
          if (!r.success) this.logger.warn(`Email copy to ${thread.customerEmail} failed: ${r.error}`);
        })
        .catch(e => this.logger.warn(`Email copy to ${thread.customerEmail} failed: ${e?.message}`));
    }

    // Return thread with all messages included (for controller broadcast)
    return this.findThread(companyId, threadId);
  }

  // ── Inbound Webhook ───────────────────────────────────────────────────────

  async handleInboundWebhook(
    companyId: string,
    payload: TwilioInboundWebhookDto,
    twilioSignature: string,
    webhookUrl: string,
  ): Promise<void> {
    const isValid = this.smsService.validateWebhookSignature(
      webhookUrl,
      payload as unknown as Record<string, string>,
      twilioSignature,
    );

    if (!isValid) {
      this.logger.warn(`Invalid Twilio signature from ${payload.From}`);
      return;
    }

    const customerPhone = payload.From;
    const body = payload.Body ?? '';

    const numMedia = parseInt(payload.NumMedia ?? '0', 10);
    const mediaUrls: string[] = [];
    for (let i = 0; i < numMedia; i++) {
      const url = (payload as any)[`MediaUrl${i}`];
      if (url) mediaUrls.push(url);
    }

    let thread = await this.prisma.messageThread.findFirst({
      where: { companyId, customerPhone, status: ThreadStatus.ACTIVE },
      orderBy: { lastMessageAt: 'desc' },
    });

    if (!thread) {
      thread = await this.prisma.messageThread.create({
        data: {
          companyId,
          customerId: `phone:${customerPhone}`,
          customerName: customerPhone,
          customerPhone,
        },
      });
      this.logger.log(`New inbound thread created for ${customerPhone}`);
    }

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          id: uuidv4(),
          threadId: thread.id,
          senderId: customerPhone,
          senderName: thread.customerName ?? customerPhone,
          direction: MessageDirection.INBOUND,
          body,
          channel: Channel.SMS,
          mediaUrls,
          twilioSid: payload.MessageSid,
          createdAt: now,
        },
      }),
      this.prisma.messageThread.update({
        where: { id: thread.id },
        data: {
          lastMessageAt: now,
          lastMessageBody: body.substring(0, 100),
          unreadCount: { increment: 1 },
          updatedAt: now,
        },
      }),
    ]);

    this.logger.log(`Inbound SMS stored: thread ${thread.id} | SID ${payload.MessageSid}`);
  }

  private enrichThread<T extends { messages?: any[] }>(thread: T): T & { channel: Channel } {
    const lastMessage = Array.isArray(thread.messages) && thread.messages.length > 0
      ? thread.messages[thread.messages.length - 1]
      : undefined;
    const channel = (lastMessage?.channel as Channel | undefined) ?? Channel.IN_APP;
    return { ...thread, channel };
  }
}
