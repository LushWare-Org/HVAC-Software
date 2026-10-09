import { Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '@tscrm/auth-client';
import { Role, type AuthUser } from '@tscrm/types';
import { viewerOf } from '../chat/chat.controller';
import type { TgUpdate } from './telegram.api';
import { ConnectBotDto, EnableBotDto, InviteDto, UpdateMeDto } from './telegram.dto';
import { TelegramService } from './telegram.service';

const ADMINS = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN];
const OFFICE = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER];

/** The company's Telegram bot and who is linked to it. */
@ApiTags('Telegram')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegram: TelegramService) {}

  // ── Office ──────────────────────────────────────────────────────────────

  @Get('settings')
  @Roles(...OFFICE)
  @ApiOperation({ summary: 'Is a bot connected, and how many people are linked' })
  status(@CurrentUser() u: AuthUser) {
    return this.telegram.status(u.companyId);
  }

  @Put('settings')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Connect (or replace) the company bot with a BotFather token' })
  connect(@CurrentUser() u: AuthUser, @Body() dto: ConnectBotDto) {
    return this.telegram.connect(u.companyId, u.userId, dto.token);
  }

  @Patch('settings')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Pause or resume Telegram messages, or switch office alerts on or off' })
  enable(@CurrentUser() u: AuthUser, @Body() dto: EnableBotDto) {
    return this.telegram.setEnabled(u.companyId, dto);
  }

  @Delete('settings')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Disconnect the bot (in-app history is kept)' })
  disconnect(@CurrentUser() u: AuthUser) {
    return this.telegram.disconnect(u.companyId);
  }

  @Get('links')
  @Roles(...OFFICE)
  @ApiOperation({ summary: 'Linked customers and technicians (optionally one customer)' })
  links(@CurrentUser() u: AuthUser, @Query('customerId') customerId?: string) {
    return this.telegram.links(u.companyId, customerId);
  }

  @Delete('links/:id')
  @Roles(...OFFICE)
  unlink(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.telegram.unlinkById(u.companyId, id);
  }

  @Post('invites')
  @HttpCode(HttpStatus.OK)
  @Roles(...OFFICE)
  @ApiOperation({ summary: 'Email customers (or technicians) their own one-tap Telegram link' })
  invite(@CurrentUser() u: AuthUser, @Body() dto: InviteDto) {
    return this.telegram.invite(u.companyId, dto);
  }

  // ── The signed-in customer or technician ────────────────────────────────

  @Get('me')
  me(@CurrentUser() u: AuthUser) {
    return this.telegram.me(viewerOf(u));
  }

  @Post('me/link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'A one-time t.me link that connects my Telegram (30 minutes)' })
  link(@CurrentUser() u: AuthUser) {
    return this.telegram.linkForMe(viewerOf(u));
  }

  @Delete('me/link')
  unlinkMe(@CurrentUser() u: AuthUser) {
    return this.telegram.unlinkMe(viewerOf(u));
  }

  @Patch('me')
  @ApiOperation({ summary: 'My Telegram settings (also-push; office: which alerts and quiet hours)' })
  updateMe(@CurrentUser() u: AuthUser, @Body() dto: UpdateMeDto) {
    return this.telegram.updateMe(viewerOf(u), dto);
  }

  @Post('me/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send myself a sample Telegram message' })
  test(@CurrentUser() u: AuthUser) {
    return this.telegram.testMe(viewerOf(u));
  }
}

/** Telegram calls this. No login: it must carry the secret this bot was given. */
@Controller('telegram/webhook')
export class TelegramWebhookController {
  constructor(private readonly telegram: TelegramService) {}

  @Post(':botId')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async hook(@Param('botId') botId: string, @Headers('x-telegram-bot-api-secret-token') secret: string | undefined, @Body() update: TgUpdate) {
    await this.telegram.webhook(botId, secret, update);
    return { ok: true }; // always 200, so a bad caller learns nothing
  }
}
