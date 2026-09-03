import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Role } from '@tscrm/types';

const DEFAULT_TTL_SECONDS = 120;
const REFRESH_MARGIN_SECONDS = 30;

interface CachedToken {
  token: string;
  expiresAtMs: number;
}

@Injectable()
export class InternalTokenService {
  private readonly logger = new Logger(InternalTokenService.name);
  private readonly cache = new Map<string, CachedToken>();
  private warnedAboutDefaultSecret = false;

  private get secret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      if (!this.warnedAboutDefaultSecret) {
        this.logger.warn(
          'JWT_SECRET is not set — falling back to the shared development secret. ' +
            'Internal calls will fail against any service configured with a real secret.',
        );
        this.warnedAboutDefaultSecret = true;
      }
      return 'tscrm-local-jwt-secret-change-in-production';
    }
    return secret;
  }

  tokenFor(companyId: string): string {
    const cached = this.cache.get(companyId);
    if (cached && cached.expiresAtMs > Date.now()) {
      return cached.token;
    }

    const ttl = Number(process.env.PARTNER_INTERNAL_TOKEN_TTL_SEC ?? DEFAULT_TTL_SECONDS);

    const token = jwt.sign(
      {
        sub: `svc:partner-api:${companyId}`,
        email: 'partner-api@internal.tscrm',
        name: 'Partner API',
        company_id: companyId,
        role: Role.OFFICE_MANAGER,
      },
      this.secret,
      { algorithm: 'HS256', expiresIn: ttl },
    );

    this.cache.set(companyId, {
      token,
      expiresAtMs: Date.now() + (ttl - REFRESH_MARGIN_SECONDS) * 1000,
    });

    return token;
  }
}
