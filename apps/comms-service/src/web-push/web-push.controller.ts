import {
  Controller, Post, Delete, Get,
  Body, UseGuards, HttpCode, HttpStatus, Headers,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@tscrm/auth-client';
import type { AuthUser } from '@tscrm/types';
import { WebPushService } from './web-push.service';
import { SubscribeWebPushDto } from './dto/subscribe.dto';

@Controller('web-push')
export class WebPushController {
  constructor(private readonly webPushService: WebPushService) {}

  /** Public — portal needs this before login to set up the subscription */
  @Get('vapid-key')
  getVapidKey() {
    return { publicKey: this.webPushService.getPublicKey() };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  subscribe(
    @CurrentUser() user: AuthUser,
    @Body() body: SubscribeWebPushDto,
    @Headers('user-agent') ua?: string,
  ) {
    return this.webPushService.subscribe(
      user.companyId,
      user.userId,
      body.endpoint,
      body.p256dh,
      body.auth,
      ua,
    );
  }

  @Delete('subscribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  unsubscribe(
    @CurrentUser() user: AuthUser,
    @Body('endpoint') endpoint: string,
  ) {
    return this.webPushService.unsubscribe(user.userId, endpoint);
  }
}
