import {
  Body,
  Delete,
  ForbiddenException,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { Request } from 'express';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import {
  CreateThreadDto,
  SendMessageDto,
  TwilioInboundWebhookDto,
  UpdateThreadStatusDto,
} from './dto/messaging.dto';
import { ThreadStatus } from '../prisma/generated';

@ApiTags('Messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messaging')
export class MessagingController {
  constructor(
    private readonly service: MessagingService,
    private readonly gateway: MessagingGateway,
  ) {}

  // ── Threads ───────────────────────────────────────────────────────────────

  @Post('threads')
  @ApiOperation({ summary: 'Create or retrieve an active thread for a customer or staff' })
  createThread(@CurrentUser() user: AuthUser, @Body() dto: CreateThreadDto) {
    if (user.role === Role.CUSTOMER && !user.customerId) {
      throw new ForbiddenException('Customer account is not linked to a customer profile');
    }
    const effectiveDto = user.role === Role.CUSTOMER
      ? { ...dto, customerId: user.customerId!, customerName: dto.customerName || user.name || user.email }
      : dto;
    return this.service.createThread(user.companyId, effectiveDto, user.userId);
  }

  @Get('threads')
  @ApiOperation({ summary: 'List message threads' })
  findThreads(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: ThreadStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const customerId = user.role === Role.CUSTOMER ? user.customerId : undefined;
    return this.service.findThreads(user.companyId, {
      status,
      page: Number(page),
      limit: Number(limit),
      customerId,
      userId: user.userId,
    });
  }

  @Get('threads/:id')
  @ApiOperation({ summary: 'Get thread with all messages' })
  findThread(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const customerId = user.role === Role.CUSTOMER ? user.customerId : undefined;
    return this.service.findThread(user.companyId, id, customerId);
  }

  @Delete('threads/:id')
  @ApiOperation({ summary: 'Permanently delete a thread and all its messages' })
  deleteThread(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const customerId = user.role === Role.CUSTOMER ? user.customerId : undefined;
    return this.service.deleteThread(user.companyId, id, user.userId, customerId);
  }

  @Patch('threads/:id/status')
  @ApiOperation({ summary: 'Update thread status (ACTIVE / RESOLVED / SPAM)' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateThreadStatusDto,
  ) {
    const customerId = user.role === Role.CUSTOMER ? user.customerId : undefined;
    return this.service.updateThreadStatus(user.companyId, id, dto.status as ThreadStatus, customerId);
  }

  @Patch('threads/:id/read')
  @ApiOperation({ summary: 'Mark all messages in thread as read (resets unreadCount)' })
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const customerId = user.role === Role.CUSTOMER ? user.customerId : undefined;
    return this.service.markThreadRead(user.companyId, id, customerId);
  }

  // ── Messages ──────────────────────────────────────────────────────────────

  @Post('threads/:id/messages')
  @ApiOperation({ summary: 'Send a message (staff↔customer or staff↔staff)' })
  async sendMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') threadId: string,
    @Body() dto: SendMessageDto,
  ) {
    const updatedThread = await this.service.sendMessage(
      user.companyId,
      threadId,
      user.userId,
      user.name ?? user.email ?? '',
      dto,
      user.role,
      user.customerId,
    );

    // Broadcast via WebSocket for real-time delivery
    const messages = updatedThread.messages ?? [];
    const newMessage = messages[messages.length - 1];
    if (newMessage) {
      this.gateway.broadcastToThread(threadId, 'new_message', {
        threadId,
        message: newMessage,
      });
      this.gateway.broadcastToThread(threadId, 'thread_updated', {
        threadId,
        lastMessageBody: updatedThread.lastMessageBody,
        lastMessageAt: updatedThread.lastMessageAt,
        unreadCount: updatedThread.unreadCount,
      });
      // Staff clients not joined to this thread still refresh their list/badge.
      this.gateway.broadcastToCompany(user.companyId, 'threads_changed', { threadId });
    }

    return updatedThread;
  }
}

// ── Twilio Inbound Webhook (no JWT guard — validated by Twilio signature) ──

@ApiTags('Webhooks')
@Controller('webhooks')
export class TwilioWebhookController {
  constructor(private readonly service: MessagingService) {}

  @Post('twilio/inbound')
  @ApiOperation({ summary: 'Twilio inbound SMS webhook — no auth required' })
  async handleInbound(
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
    @Body() payload: TwilioInboundWebhookDto,
  ) {
    // companyId resolution: production would look up by Twilio number in request
    // For now, using a company-id from query/header that the gateway injects
    const companyId = req.headers['x-company-id'] as string ?? '';
    const webhookUrl = `${req.protocol}://${req.headers.host}${req.path}`;

    await this.service.handleInboundWebhook(companyId, payload, signature, webhookUrl);

    // Twilio expects 2xx with empty TwiML or plain text
    return '<Response></Response>';
  }
}
