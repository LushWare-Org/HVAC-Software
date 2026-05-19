import {
  Controller, Post, Body, Res, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { IsString, IsArray, IsOptional, IsIn } from 'class-validator';
import { JwtAuthGuard, CurrentUser } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';
import { ChatService, ChatTurn } from './chat.service';
import { BotType } from '../prompts/prompt.service';

class ChatTurnDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  content!: string;
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
    // Derive botType server-side from JWT — client cannot override this
    const botType: BotType = user.role === 'customer' ? 'customer' : 'admin';

    // Extract raw token so tool executor can forward it to downstream services in prod
    const authHeader = req.headers['authorization'] ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    const ctx = {
      companyId: user.companyId,
      customerId: user.customerId,
      userId: user.userId,
      role: user.role,
      email: user.email ?? '',
      token,
    };

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

      for await (const chunk of stream) {
        if (chunk.startsWith('__STATUS__')) {
          const tool = chunk.slice('__STATUS__'.length).replace(/_/g, ' ')
          res.write(`data: ${JSON.stringify({ status: `Looking up ${tool}…` })}\n\n`)
        } else {
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
        }
      }

      res.write('data: [DONE]\n\n');
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: 'Chat service error. Please try again.' })}\n\n`);
    } finally {
      res.end();
    }
  }
}
