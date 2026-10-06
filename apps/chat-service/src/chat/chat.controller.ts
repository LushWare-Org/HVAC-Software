import {
  Controller, Post, Body, Res, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { IsString, IsArray, IsOptional, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard, CurrentUser } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';
import { ChatService, ChatTurn } from './chat.service';
import { confirmAction } from '../agent/action-runner';
import { agentContext } from '../agent/context';
import type { AgentContext } from '../agent/types';
import { BotType } from '../prompts/prompt.service';

class ChatTurnDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  content!: string;
}

class ConfirmActionDto {
  @IsString()
  token!: string;
}

class PageRecordDto {
  @IsString() type!: string;
  @IsString() id!: string;
  @IsString() label!: string;
}

class PageContextDto {
  @IsString() page!: string;
  @IsString() label!: string;
  @IsOptional() @IsString() filter?: string;
  @IsOptional() @ValidateNested() @Type(() => PageRecordDto) record?: PageRecordDto;
}

class ChatRequestDto {
  @IsString()
  message!: string;

  @IsArray()
  @IsOptional()
  history?: ChatTurnDto[];

  @IsOptional() @ValidateNested() @Type(() => PageContextDto)
  context?: PageContextDto;
}

@UseGuards(JwtAuthGuard)
@Controller('')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  async message(
    @Body() body: ChatRequestDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { botType, ctx } = agentContext(user, req);

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const stream = this.chatService.streamResponse(
        { message: body.message, history: body.history ?? [], context: body.context },
        botType,
        ctx,
      );

      for await (const ev of stream) {
        if (ev.type === 'chunk') res.write(`data: ${JSON.stringify({ chunk: ev.text })}\n\n`);
        else if (ev.type === 'status') res.write(`data: ${JSON.stringify({ status: ev.text })}\n\n`);
        else res.write(`data: ${JSON.stringify({ action: ev.action })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: 'Chat service error. Please try again.' })}\n\n`);
    } finally {
      res.end();
    }
  }

  /** Runs an action the person confirmed on a card. */
  @Post('actions/confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(@Body() body: ConfirmActionDto, @CurrentUser() user: AuthUser, @Req() req: Request) {
    const { botType, ctx } = agentContext(user, req);
    return confirmAction(body.token, ctx, botType);
  }
}
