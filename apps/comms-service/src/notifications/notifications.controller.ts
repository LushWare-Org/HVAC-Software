/**
 * NotificationsController
 * REST API for sending notifications and querying delivery history.
 */

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { NotificationsService } from './notifications.service';
import {
  SendSmsDto,
  SendEmailDto,
  SendPushDto,
  SendInAppNotificationDto,
  NotificationChannelFilter,
  NotificationStatusFilter,
} from './dto/send-notification.dto';
import { Channel, DeliveryStatus } from '../prisma/generated';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
// Sending goes out under the company's own Twilio and SendGrid identity and
// costs money per message. These routes were open to any signed-in role,
// including customers who had registered themselves, so anyone could send
// arbitrary SMS and email as the contractor. Staff only.
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ── SMS ──────────────────────────────────────────────────────────────────

  @Post('sms')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Queue an SMS notification' })
  sendSms(@CurrentUser() user: AuthUser, @Body() dto: SendSmsDto) {
    return this.notificationsService.sendSms({
      companyId: user.companyId,
      ...dto,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    });
  }

  // ── Email ─────────────────────────────────────────────────────────────────

  @Post('email')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Queue an email notification' })
  sendEmail(@CurrentUser() user: AuthUser, @Body() dto: SendEmailDto) {
    return this.notificationsService.sendEmail({
      companyId: user.companyId,
      ...dto,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    });
  }

  // ── Push ──────────────────────────────────────────────────────────────────

  @Post('push')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Queue a push notification' })
  sendPush(@CurrentUser() user: AuthUser, @Body() dto: SendPushDto) {
    return this.notificationsService.sendPush({
      companyId: user.companyId,
      ...dto,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    });
  }

  @Post('in-app')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Send an in-app notification broadcast' })
  sendInApp(@CurrentUser() user: AuthUser, @Body() dto: SendInAppNotificationDto) {
    return this.notificationsService.sendInApp({
      companyId: user.companyId,
      sender: user,
      title: dto.title,
      body: dto.body,
      type: dto.type,
      roles: dto.roles,
      recipients: dto.recipients,
    });
  }

  // ── List ──────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List notifications with optional filters' })
  @ApiQuery({ name: 'channel', enum: NotificationChannelFilter, required: false })
  @ApiQuery({ name: 'status', enum: NotificationStatusFilter, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('channel') channel?: Channel,
    @Query('status') status?: DeliveryStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.notificationsService.findAll(user.companyId, user, {
      channel,
      status,
      page: Number(page),
      limit: Number(limit),
    });
  }

  // ── Mark all notifications as read ────────────────────────────────────────

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllRead(user.companyId, user);
  }

  // ── Mark single notification as read ────────────────────────────────────

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationsService.markRead(user.companyId, user, id);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get delivery statistics grouped by channel and status' })
  getStats(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getDeliveryStats(user.companyId);
  }
}
