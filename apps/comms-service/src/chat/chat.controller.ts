import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard } from '@tscrm/auth-client';
import type { AuthUser } from '@tscrm/types';
import { NotificationsService } from '../notifications/notifications.service';
import { directEmailHtml } from '../direct-notify/direct-notify.service';
import { ChatService } from './chat.service';
import { ChatDirectory } from './chat.directory';
import { isCustomer, isOffice, isTechnician, type Viewer } from './chat.policy';
import {
  ArchiveDto, CreateGroupDto, EditMessageDto, MuteDto, OpenCustomerTechDto, OpenDirectDto, OpenOfficeDto, OpenTechOfficeDto,
  ReadDto, SendChatMessageDto,
} from './chat.dto';

export const viewerOf = (u: AuthUser): Viewer => ({
  userId: u.userId, companyId: u.companyId, role: String(u.role ?? '').toLowerCase(),
  name: u.name ?? u.email ?? 'User', customerId: u.customerId ?? null,
});

/**
 * In-app messages. Every route acts as the signed-in person and goes through
 * the same access rule; nothing here takes a company, customer or sender from
 * the request body.
 */
@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chat: ChatService,
    private readonly dir: ChatDirectory,
    private readonly notifications: NotificationsService,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Conversations I can see, newest first, with my unread counts' })
  list(@CurrentUser() u: AuthUser, @Query('q') q?: string, @Query('archived') archived?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.chat.list(viewerOf(u), { q, archived: archived === 'true', page: Number(page), limit: Number(limit) });
  }

  @Get('unread')
  @ApiOperation({ summary: 'My unread counts, per conversation and in total' })
  unread(@CurrentUser() u: AuthUser) {
    return this.chat.unreadSummary(viewerOf(u));
  }

  @Get('contacts')
  @ApiOperation({ summary: 'Who I can start a conversation with' })
  async contacts(@CurrentUser() u: AuthUser) {
    const v = viewerOf(u);
    const company = await this.dir.companyName(v.companyId);
    if (isCustomer(v)) {
      const techs = await this.dir.techsForCustomer(v.companyId, v.customerId ?? '');
      return { office: { name: company }, technicians: techs.map((t) => ({ userId: t.id, name: t.name, avatarUrl: t.avatarUrl })) };
    }
    const colleagues = (await this.dir.colleagues(v.companyId, v.userId)).map((c) => ({ userId: c.id, name: c.name, role: c.role, avatarUrl: c.avatarUrl }));
    if (isTechnician(v)) {
      const customers = await this.dir.customersForTech(v.companyId, v.userId);
      return { office: { name: company }, colleagues, customers: customers.map((c) => ({ customerId: c.id, name: c.name })) };
    }
    // The office opens customer conversations from the customer list / search, so no customer list here.
    return { colleagues };
  }

  @Get('conversations/:id')
  detail(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.chat.detail(viewerOf(u), id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Older messages (before a sequence number)' })
  messages(@CurrentUser() u: AuthUser, @Param('id') id: string, @Query('before') before?: string, @Query('limit') limit?: string) {
    return this.chat.messages(viewerOf(u), id, before ? Number(before) : undefined, Number(limit) || 50);
  }

  // ── Opening conversations ───────────────────────────────────────────────

  @Post('conversations/office')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'A customer and the office (customers: their own; office: any customer)' })
  async openOffice(@CurrentUser() u: AuthUser, @Body() dto: OpenOfficeDto) {
    const v = viewerOf(u);
    return this.chat.detail(v, await this.chat.openOffice(v, dto.customerId));
  }

  @Post('conversations/customer-tech')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'A customer and a technician who worked for them, privately' })
  async openCustomerTech(@CurrentUser() u: AuthUser, @Body() dto: OpenCustomerTechDto) {
    const v = viewerOf(u);
    return this.chat.detail(v, await this.chat.openCustomerTech(v, dto));
  }

  @Post('conversations/tech-office')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'A technician and the office' })
  async openTechOffice(@CurrentUser() u: AuthUser, @Body() dto: OpenTechOfficeDto) {
    const v = viewerOf(u);
    return this.chat.detail(v, await this.chat.openTechOffice(v, dto.techUserId));
  }

  @Post('conversations/direct')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Two staff members' })
  async openDirect(@CurrentUser() u: AuthUser, @Body() dto: OpenDirectDto) {
    const v = viewerOf(u);
    return this.chat.detail(v, await this.chat.openDirect(v, dto.userId));
  }

  @Post('conversations/group')
  @ApiOperation({ summary: 'A group of staff members' })
  async createGroup(@CurrentUser() u: AuthUser, @Body() dto: CreateGroupDto) {
    const v = viewerOf(u);
    return this.chat.detail(v, await this.chat.createGroup(v, dto.userIds, dto.title));
  }

  // ── Sending ─────────────────────────────────────────────────────────────

  @Post('conversations/:id/messages')
  async send(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: SendChatMessageDto) {
    const v = viewerOf(u);
    if (dto.via && isCustomer(v)) throw new ForbiddenException('Not available to customers');
    const message = await this.chat.send(v, id, dto);
    if (dto.alsoEmail && !isCustomer(v)) void this.emailCopy(v, id, message.body);
    return message;
  }

  /** Office (or a service acting for it, e.g. Kelvin): message a customer without first finding their conversation. */
  @Post('customers/:customerId/messages')
  async sendToCustomer(@CurrentUser() u: AuthUser, @Param('customerId') customerId: string, @Body() dto: SendChatMessageDto) {
    const v = viewerOf(u);
    if (!isOffice(v)) throw new ForbiddenException('Only the office can message customers this way');
    const conv = await this.chat.openOffice(v, customerId);
    const message = await this.chat.send(v, conv.id, dto);
    if (dto.alsoEmail) void this.emailCopy(v, conv.id, message.body);
    return { conversationId: conv.id, message };
  }

  /** Customers and technicians: message the office. */
  @Post('office/messages')
  async sendToOffice(@CurrentUser() u: AuthUser, @Body() dto: SendChatMessageDto) {
    const v = viewerOf(u);
    if (dto.via && isCustomer(v)) throw new ForbiddenException('Not available to customers');
    const conv = isCustomer(v) ? await this.chat.openOffice(v) : await this.chat.openTechOffice(v);
    return { conversationId: conv.id, message: await this.chat.send(v, conv.id, dto) };
  }

  // ── Reading, muting, hiding, archiving ──────────────────────────────────

  @Patch('conversations/:id/read')
  read(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: ReadDto) {
    return this.chat.markRead(viewerOf(u), id, dto?.seq);
  }

  @Patch('conversations/:id/mute')
  mute(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: MuteDto) {
    return this.chat.mute(viewerOf(u), id, dto?.until ?? null);
  }

  @Patch('conversations/:id/hide')
  hide(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.chat.hide(viewerOf(u), id);
  }

  @Patch('conversations/:id/archive')
  archive(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: ArchiveDto) {
    return this.chat.archive(viewerOf(u), id, dto.archived);
  }

  @Patch('messages/:id')
  edit(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: EditMessageDto) {
    return this.chat.edit(viewerOf(u), id, dto.body);
  }

  @Delete('messages/:id')
  remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.chat.remove(viewerOf(u), id);
  }

  /** A copy by email, for customers who don't keep the portal open. Never fails the message itself. */
  private async emailCopy(v: Viewer, conversationId: string, body: string) {
    try {
      const conv = await this.chat.visible(v, conversationId);
      if (!conv.customerId) return;
      const customer = await this.dir.customer(v.companyId, conv.customerId);
      if (!customer?.email) return;
      const company = await this.dir.companyName(v.companyId);
      await this.notifications.sendEmail({
        companyId: v.companyId, customerId: conv.customerId, recipientId: conv.customerId,
        recipientName: customer.name, recipientEmail: customer.email,
        subject: `New message from ${company}`, htmlBody: directEmailHtml(company, customer.name, `${body}\n\nReply in your customer portal.`),
      });
    } catch (err) {
      this.logger.warn(`chat email copy failed: ${(err as Error).message}`);
    }
  }
}
