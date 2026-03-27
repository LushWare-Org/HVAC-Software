/**
 * MessagingService — Two-way SMS conversation threads between company staff and customers.
 *
 * Architecture:
 *  - Outbound: Staff sends message via REST → stored as OUTBOUND message in thread → Twilio delivers
 *  - Inbound:  Twilio webhook → match thread by customer phone → store as INBOUND message → update unreadCount
 *
 * MongoDB document model:
 *  - MessageThread has an embedded `messages Message[]` array (no separate collection)
 *  - Avoids join queries for the most common read (load thread with all messages)
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
import { CreateThreadDto, SendMessageDto, TwilioInboundWebhookDto } from './dto/messaging.dto';
import { MessageDirection, ThreadStatus, Channel } from '../prisma/generated';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
  ) {}

  // ── Threads ───────────────────────────────────────────────────────────────

  async createThread(companyId: string, dto: CreateThreadDto, creatorId?: string) {
    const isCustomerThread = !!dto.customerId;

    if (isCustomerThread) {
      // Check for existing open thread for same customer
      const existing = await this.prisma.messageThread.findFirst({
        where: {
          companyId,
          customerId: dto.customerId,
          status: ThreadStatus.ACTIVE,
          ...(dto.jobId ? { jobId: dto.jobId } : {}),
        },
      });
      if (existing) return existing;
    } else if (dto.participantIds?.length) {
      // Staff thread — check for existing thread with same participants
      const allParticipants = creatorId
        ? [...new Set([creatorId, ...dto.participantIds])].sort()
        : [...dto.participantIds].sort();
      const existing = await this.prisma.messageThread.findFirst({
        where: {
          companyId,
          status: ThreadStatus.ACTIVE,
          participantIds: { equals: allParticipants },
        },
      });
      if (existing) return existing;

      return this.prisma.messageThread.create({
        data: {
          companyId,
          participantIds: allParticipants,
          participantNames: dto.participantNames ?? [],
          subject: dto.subject,
          jobId: dto.jobId,
          messages: [],
        },
      });
    }

    return this.prisma.messageThread.create({
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
        messages: [],
      },
    });
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
      // Customer viewing their own threads
      where.customerId = customerId;
    } else if (userId) {
      // Staff member — show customer threads + threads they participate in
      where = {
        companyId,
        ...(status ? { status } : {}),
        OR: [
          { customerId: { not: null } },           // all customer threads (visible to staff)
          { participantIds: { has: userId } },      // staff threads they're in
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.messageThread.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.messageThread.count({ where }),
    ]);
    return { data: items.map((thread) => this.enrichThread(thread)), total, page, limit };
  }

  async findThread(companyId: string, id: string, customerId?: string) {
    const thread = await this.prisma.messageThread.findFirst({
      where: {
        id,
        companyId,
        ...(customerId ? { customerId } : {}),
      },
    });
    if (!thread) throw new NotFoundException(`Thread ${id} not found`);
    return this.enrichThread(thread);
  }

  async updateThreadStatus(companyId: string, id: string, status: ThreadStatus, customerId?: string) {
    await this.findThread(companyId, id, customerId);
    return this.prisma.messageThread.update({
      where: { id },
      data: { status },
    });
  }

  async markThreadRead(companyId: string, id: string, customerId?: string) {
    await this.findThread(companyId, id, customerId);
    return this.prisma.messageThread.update({
      where: { id },
      data: { unreadCount: 0 },
    });
  }

  // ── Messages ──────────────────────────────────────────────────────────────

  /**
   * Staff sends an outbound message to a customer.
   * The message is stored in the thread and sent via Twilio.
   */
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

    // In staff threads, direction is always OUTBOUND (from sender's perspective)
    // In customer threads, INBOUND = customer sent, OUTBOUND = staff sent
    const direction = customerSender ? MessageDirection.INBOUND : MessageDirection.OUTBOUND;

    const message = {
      id: uuidv4(),
      senderId,
      senderName,
      direction,
      body: dto.body.trim(),
      channel: Channel.IN_APP,
      mediaUrls: dto.mediaUrls ?? [],
      createdAt: new Date(),
      sentAt: new Date(),
    };

    const updatedThread = await this.prisma.messageThread.update({
      where: { id: threadId },
      data: {
        messages: { push: message },
        lastMessageAt: new Date(),
        lastMessageBody: message.body.substring(0, 100),
        // In staff threads, increment unread for the other participant
        // In customer threads, increment only when customer sends
        unreadCount: customerSender || isStaffThread ? { increment: 1 } : 0,
      },
    });

    return this.enrichThread(updatedThread);
  }

  // ── Inbound Webhook ───────────────────────────────────────────────────────

  /**
   * Handles inbound Twilio webhook.
   * Finds the thread by customer phone → appends INBOUND message → increments unreadCount.
   * Creates a new thread if none exists (handles first-time inbound).
   */
  async handleInboundWebhook(
    companyId: string,
    payload: TwilioInboundWebhookDto,
    twilioSignature: string,
    webhookUrl: string,
  ): Promise<void> {
    // Validate Twilio signature
    const isValid = this.smsService.validateWebhookSignature(
      webhookUrl,
      payload as unknown as Record<string, string>,
      twilioSignature,
    );

    if (!isValid) {
      this.logger.warn(`Invalid Twilio signature from ${payload.From}`);
      return; // silently ignore — prevents replay attacks
    }

    const customerPhone = payload.From;
    const body = payload.Body ?? '';

    // Collect media URLs from Twilio multipart fields
    const numMedia = parseInt(payload.NumMedia ?? '0', 10);
    const mediaUrls: string[] = [];
    for (let i = 0; i < numMedia; i++) {
      const url = (payload as any)[`MediaUrl${i}`];
      if (url) mediaUrls.push(url);
    }

    // Find or create thread
    let thread = await this.prisma.messageThread.findFirst({
      where: { companyId, customerPhone, status: ThreadStatus.ACTIVE },
      orderBy: { lastMessageAt: 'desc' },
    });

    if (!thread) {
      thread = await this.prisma.messageThread.create({
        data: {
          companyId,
          customerId: `phone:${customerPhone}`,  // placeholder until CRM linkage
          customerName: customerPhone,
          customerPhone,
          messages: [],
        },
      });
      this.logger.log(`New inbound thread created for ${customerPhone}`);
    }

    const message = {
      id: uuidv4(),
      senderId: customerPhone,
      senderName: thread.customerName ?? customerPhone,
      direction: MessageDirection.INBOUND,
      body,
      channel: Channel.SMS,
      mediaUrls,
      twilioSid: payload.MessageSid,
      createdAt: new Date(),
    };

    await this.prisma.messageThread.update({
      where: { id: thread.id },
      data: {
        messages: { push: message },
        lastMessageAt: new Date(),
        lastMessageBody: body.substring(0, 100),
        unreadCount: { increment: 1 },
      },
    });

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
