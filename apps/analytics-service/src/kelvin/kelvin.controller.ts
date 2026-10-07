import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';
import { KelvinLogService, type SpeakMode, type Tone } from './kelvin-log.service';
import { KelvinMindService, type Who } from './kelvin-mind.service';

/** Read side of Kelvin's memory, always scoped to the signed-in person. */
@ApiTags('Kelvin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kelvin')
export class KelvinController {
  constructor(private readonly log: KelvinLogService, private readonly mind: KelvinMindService) {}

  @Post('state')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Which of these items Kelvin already told, showed or had dismissed, for me' })
  state(@CurrentUser() user: AuthUser, @Body() body: { itemIds?: unknown }) {
    const ids = Array.isArray(body?.itemIds) ? body.itemIds.filter((i): i is string => typeof i === 'string') : [];
    return this.log.state(user.companyId, user.userId, ids);
  }

  @Get('events')
  @ApiOperation({ summary: 'What Kelvin said and did for me since a time (default: last 24 h)' })
  events(@CurrentUser() user: AuthUser, @Query('since') since?: string) {
    const at = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (Number.isNaN(at.getTime())) throw new BadRequestException('since must be an ISO date');
    return this.log.since(user.companyId, user.userId, at);
  }

  @Get('prefs')
  prefs(@CurrentUser() user: AuthUser) {
    return this.log.prefs(user.companyId, user.userId);
  }

  @Put('prefs')
  setPrefs(@CurrentUser() user: AuthUser, @Body() body: { speakMode?: SpeakMode; quietUntil?: string | null; tone?: Tone }) {
    return this.log.setPrefs(user.companyId, user.userId, body ?? {});
  }

  @Get('mind')
  @ApiOperation({ summary: 'My notes, routines and learned habits, for Kelvin to use in a conversation' })
  getMind(@CurrentUser() user: AuthUser) {
    return this.mind.mind(who(user));
  }

  @Get('routines')
  async getRoutines(@CurrentUser() user: AuthUser) {
    return { data: await this.mind.routines(who(user)) };
  }

  @Post('notes')
  addNote(@CurrentUser() user: AuthUser, @Body() body: { text?: string; forEveryone?: boolean }) {
    return this.mind.addNote(who(user), body ?? {});
  }

  @Delete('notes/:id')
  removeNote(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.mind.removeNote(who(user), id);
  }

  @Post('routines')
  addRoutine(@CurrentUser() user: AuthUser, @Body() body: { request?: string; days?: number[]; time?: string; timezone?: string }) {
    return this.mind.addRoutine(who(user), body ?? {});
  }

  @Delete('routines/:id')
  removeRoutine(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.mind.removeRoutine(who(user), id);
  }
}

const who = (user: AuthUser): Who => ({ companyId: user.companyId, userId: user.userId, role: String(user.role), name: (user as { name?: string }).name });
