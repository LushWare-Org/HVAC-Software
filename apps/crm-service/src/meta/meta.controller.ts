import {
  Controller, Get, Post,
  Query, Req, Headers,
  HttpCode, HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MetaService } from './meta.service';

@ApiTags('Meta Webhooks')
@Controller('meta')
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  /**
   * GET /meta/webhook
   */
  @Get('webhook')
  @ApiOperation({ summary: 'Meta webhook verification challenge' })
  verifyWebhook(
    @Query('hub.mode')         mode:      string,
    @Query('hub.verify_token') token:     string,
    @Query('hub.challenge')    challenge: string,
  ): string {
    return this.metaService.verify(mode, token, challenge);
  }

  /**
   * POST /meta/webhook
   * X-Hub-Signature-256 verification.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive Meta lead-gen webhook events' })
  async receiveWebhook(
    @Req()                                req: Request & { rawBody?: Buffer },
    @Headers('x-hub-signature-256')       signature: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    await this.metaService.handleWebhook(rawBody, signature);
    return { received: true };
  }
}
