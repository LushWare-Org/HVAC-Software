import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import {
  PARTNER_REQUEST_KEY,
  PartnerContext,
} from '../auth/partner-context';

@Injectable()
export class CallLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CallLogMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const fullPath = (req.originalUrl ?? req.url ?? '').split('?')[0];

    if (fullPath === '/health') {
      return next();
    }

    const startedAt = Date.now();

    res.once('finish', () => {
      // The guard has run by now, so the partner context is present whenever
      // authentication succeeded.
      const partner: PartnerContext | undefined = (req as any)[
        PARTNER_REQUEST_KEY
      ];

      void this.write({
        apiKeyId: partner?.keyId ?? null,
        companyId: partner?.companyId ?? null,
        method: req.method,
        // req.route is only populated once a handler matched; fall back to the
        // raw path so unmatched and rejected requests are still attributable.
        path: (req as any).route?.path ?? fullPath,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
        errorCode: res.statusCode >= 400 ? String(res.statusCode) : null,
      });
    });

    next();
  }

  private async write(data: {
    apiKeyId: string | null;
    companyId: string | null;
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    ip: string | null;
    userAgent: string | null;
    errorCode: string | null;
  }): Promise<void> {
    try {
      await this.prisma.partnerApiCall.create({ data });
    } catch (err) {
      this.logger.warn(`Failed to write partner call log: ${err}`);
    }
  }
}
