import {
  Controller, Post, Body, Res, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { IsString, IsArray, IsOptional, IsIn } from 'class-validator';
import { JwtAuthGuard, CurrentUser } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';
import { ChatService, ChatTurn } from './chat.service';
import { confirmAction } from '../agent/action-runner';
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

class ChatRequestDto {
  @IsString()
  message!: string;

  @IsArray()
  @IsOptional()
  history?: ChatTurnDto[];
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
    const { botType, ctx } = this.context(user, req);

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const stream = this.chatService.streamResponse(
        { message: body.message, history: body.history ?? [] },
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
    const { botType, ctx } = this.context(user, req);
    return confirmAction(body.token, ctx, botType);
  }

  /** Bot type comes from the token, never from the client. */
  private context(user: AuthUser, req: Request): { botType: BotType; ctx: AgentContext } {
    const botType: BotType = user.role === 'customer' ? 'customer' : 'admin';
    const authHeader = req.headers['authorization'] ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    return {
      botType,
      ctx: {
        companyId: user.companyId,
        customerId: user.customerId,
        userId: user.userId,
        role: String(user.role),
        email: user.email ?? '',
        name: (user as { name?: string }).name,
        token,
      },
    };
  }
}
