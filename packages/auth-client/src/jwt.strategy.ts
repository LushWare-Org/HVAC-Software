import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { AuthUser, JwtPayload, Role } from '@tscrm/types';

const LOCAL_JWT_SECRET = process.env.JWT_SECRET || 'tscrm-local-jwt-secret-change-in-production';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const domain = process.env.AUTH0_DOMAIN;
    const audience = process.env.AUTH0_AUDIENCE;

    // Build Auth0 JWKS provider (only if domain configured)
    const auth0Provider = domain
      ? passportJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: `https://${domain}/.well-known/jwks.json`,
        })
      : null;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Support both HS256 (local) and RS256 (Auth0)
      algorithms: ['HS256', 'RS256'],
      // Custom provider that routes to the right secret
      secretOrKeyProvider: (request: any, rawJwtToken: string, done: (err: any, secret?: string | Buffer) => void) => {
        try {
          // Decode header without verifying to check algorithm
          const parts = rawJwtToken.split('.');
          const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());

          if (header.alg === 'HS256') {
            // Local JWT — use symmetric secret
            done(null, LOCAL_JWT_SECRET);
          } else if (auth0Provider) {
            // Auth0 JWT — use JWKS
            (auth0Provider as any)(request, rawJwtToken, done);
          } else {
            done(new Error('Auth0 not configured and token is not locally signed'));
          }
        } catch (err) {
          done(err);
        }
      },
    });
  }

  /**
   * Called after JWT signature is verified.
   * The returned object is attached to request.user
   */
  validate(payload: JwtPayload): AuthUser {
    return {
      userId: payload.sub,
      email: payload.email,
      companyId: payload['company_id'] as string,
      role: payload['role'] as Role,
      name: payload.name,
      customerId: payload['customer_id'] as string | undefined,
    };
  }
}
