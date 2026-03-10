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

  async createThread(companyId: string, dto: CreateThreadDto) {
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

    return this.prisma.messageThread.create({
      data: {
        companyId,
        customerId: dto.customerId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail,
        jobId: dto.jobId,
        messages: [],
      },
    });
  }

  async findThreads(
    companyId: string,
    params: { status?: ThreadStatus; page?: number; limit?: number },
  ) {
    const { status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where = {
      companyId,
      ...(status ? { status } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.messageThread.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.messageThread.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findThread(companyId: string, id: string) {
    const thread = await this.prisma.messageThread.findFirst({
      where: { id, companyId },
    });
    if (!thread) throw new NotFoundException(`Thread ${id} not found`);
    return thread;
  }

  async updateThreadStatus(companyId: string, id: string, status: ThreadStatus) {
    await this.findThread(companyId, id);
    return this.prisma.messageThread.update({
      where: { id },
      data: { status },
    });
  }

  async markThreadRead(companyId: string, id: string) {
    await this.findThread(companyId, id);
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
  ) {
    const thread = await this.findThread(companyId, threadId);

    if (!thread.customerPhone) {
      throw new BadRequestException('Thread has no customer phone number for SMS');
    }

    const message = {
      id: uuidv4(),
      senderId,
      senderName,
      direction: MessageDirection.OUTBOUND,
      body: dto.body,
      channel: Channel.SMS,
      mediaUrls: dto.mediaUrls ?? [],
      createdAt: new Date(),
    };

    // Deliver via Twilio
    const result = await this.smsService.send(thread.customerPhone, dto.body);

    const updatedThread = await this.prisma.messageThread.update({
      where: { id: threadId },
      data: {
        messages: {
          push: {
            ...message,
            twilioSid: result.externalId,
            sentAt: result.success ? new Date() : undefined,
          },
        },
        lastMessageAt: new Date(),
        lastMessageBody: dto.body.substring(0, 100),
      },
    });

    if (!result.success) {
      this.logger.warn(`SMS delivery failed for thread ${threadId}: ${result.error}`);
    }

    return updatedThread;
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
      senderName: thread.customerName,
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
}
