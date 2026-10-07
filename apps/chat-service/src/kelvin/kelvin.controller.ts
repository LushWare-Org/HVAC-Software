import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser, JwtAuthGuard } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';
import { agentContext } from '../agent/context';
import { KelvinService } from './kelvin.service';
import type { KelvinPrefs } from './types';

@UseGuards(JwtAuthGuard)
@Controller('kelvin')
export class KelvinController {
  constructor(private readonly kelvin: KelvinService) {}

  @Get('feed')
  feed(@CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.kelvin.feed(agentContext(user, req).ctx);
  }

  @Post('events')
  @HttpCode(HttpStatus.OK)
  events(@CurrentUser() user: AuthUser, @Req() req: Request, @Body() body: { type?: string; itemId?: string; summary?: string }) {
    this.kelvin.recordClientEvent(agentContext(user, req).ctx, body ?? {});
    return { ok: true };
  }

  @Get('prefs')
  prefs(@CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.kelvin.prefs(agentContext(user, req).ctx);
  }

  @Put('prefs')
  setPrefs(@CurrentUser() user: AuthUser, @Req() req: Request, @Body() body: Partial<KelvinPrefs>) {
    return this.kelvin.setPrefs(agentContext(user, req).ctx, body ?? {});
  }

  @Get('today')
  today(@CurrentUser() user: AuthUser, @Req() req: Request, @Query('since') since?: string) {
    return this.kelvin.today(agentContext(user, req).ctx, since);
  }

  @Get('mind')
  mind(@CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.kelvin.mind(agentContext(user, req).ctx);
  }

  @Delete('notes/:id')
  forgetNote(@CurrentUser() user: AuthUser, @Req() req: Request, @Param('id') id: string) {
    return this.kelvin.forgetNote(agentContext(user, req).ctx, id);
  }

  @Delete('routines/:id')
  removeRoutine(@CurrentUser() user: AuthUser, @Req() req: Request, @Param('id') id: string) {
    return this.kelvin.removeRoutine(agentContext(user, req).ctx, id);
  }
}
