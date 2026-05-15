import { Controller, Get, Param, Res, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { SuppressionService } from '../suppression/suppression.service';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';
import { MarketingChannel, SendEventType, SuppressionReason } from '../prisma/generated';
import {
  verifyMarketingToken,
  UnsubscribeTokenPayload,
  ClickTokenPayload,
} from '../common/marketing-token.util';

@ApiTags('Marketing — Public')
@Controller('m')
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

  constructor(
    private readonly suppressionService: SuppressionService,
    private readonly prisma: MarketingPrismaService,
  ) {}

  @Get('u/:token')
  @ApiOperation({ summary: 'One-click unsubscribe (unauthenticated, customer-facing)' })
  async unsubscribe(@Param('token') token: string, @Res() res: Response): Promise<void> {
    let payload: UnsubscribeTokenPayload;
    try {
      const decoded = verifyMarketingToken(token);
      if (decoded.type !== 'unsub') throw new Error('wrong token type');
      payload = decoded as UnsubscribeTokenPayload;
    } catch {
      res.status(HttpStatus.GONE).send(this.renderPage('Link Expired', 'This unsubscribe link has expired or is invalid.'));
      return;
    }

    try {
      await this.suppressionService.addSuppression(
        payload.companyId,
        payload.channel as MarketingChannel,
        payload.address,
        SuppressionReason.UNSUBSCRIBED,
      );

      if (payload.sendJobId) {
        void this.prisma.sendEvent.create({
          data: { sendJobId: payload.sendJobId, eventType: SendEventType.UNSUBSCRIBED },
        }).catch((err: Error) => this.logger.warn(`Failed to write unsubscribe event: ${err.message}`));
      }

    } catch (err) {
      this.logger.error(`Unsubscribe failed for ${payload.address}: ${(err as Error).message}`);
    }

    res.status(HttpStatus.OK).send(
      this.renderPage('Unsubscribed', "You've been successfully unsubscribed. You won't receive further marketing messages from us."),
    );
  }

  @Get('p/:sendJobId')
  @ApiOperation({ summary: '1×1 open-tracking pixel — records OPENED event' })
  async trackOpen(@Param('sendJobId') sendJobId: string, @Res() res: Response): Promise<void> {
    // Fire-and-forget DB write — do not block the pixel response
    void this.prisma.sendEvent.create({
      data: { sendJobId, eventType: SendEventType.OPENED },
    }).catch((err: Error) => this.logger.warn(`Open-pixel DB error for ${sendJobId}: ${err.message}`));

    // 1×1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).end(pixel);
  }

  @Get('r/:token')
  @ApiOperation({ summary: 'Tracked click redirect (unauthenticated, customer-facing)' })
  async trackClick(@Param('token') token: string, @Res() res: Response): Promise<void> {
    let payload: ClickTokenPayload;
    try {
      const decoded = verifyMarketingToken(token);
      if (decoded.type !== 'click') throw new Error('wrong token type');
      payload = decoded as ClickTokenPayload;
    } catch {
      res.status(HttpStatus.GONE).send(this.renderPage('Link Expired', 'This link has expired or is invalid.'));
      return;
    }

    // Fire-and-forget — do not delay the redirect waiting for DB write
    void this.prisma.sendEvent.create({
      data: {
        sendJobId: payload.sendJobId,
        eventType: SendEventType.CLICKED,
        urlClicked: payload.destinationUrl,
      },
    }).catch((err: Error) => this.logger.warn(`Failed to write click event: ${err.message}`));

    res.redirect(HttpStatus.FOUND, payload.destinationUrl);
  }

  private renderPage(title: string, message: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; }
    .card { background: #fff; border-radius: 12px; padding: 2.5rem; max-width: 420px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
    h1 { font-size: 1.5rem; color: #111827; margin-bottom: .75rem; }
    p { color: #6b7280; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
  }
}
