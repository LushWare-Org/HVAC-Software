import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { requireJwtSecret } from '@tscrm/auth-client';

export type IotProvider = 'honeywell' | 'nest';

export interface OAuthStatePayload {
  companyId: string;
  customerId: string;
  source: 'admin' | 'portal';
  provider: IotProvider;
}

// The state travels through the provider and comes back on a public, unauthenticated
// callback, so it is the only thing saying which customer to attach the devices to.
// Signed with a key DERIVED from the JWT secret (never the secret itself) and bound
// to its own audience, so neither a login token nor a password-reset token can be
// replayed as a state, and an unsigned or edited state is refused.
const STATE_TTL = '15m';
const STATE_AUDIENCE = 'iot-oauth-state';

function signingKey(): Buffer {
  return crypto.createHmac('sha256', requireJwtSecret()).update('iot-oauth-state-v1').digest();
}

export function signOAuthState(payload: OAuthStatePayload): string {
  return jwt.sign(payload, signingKey(), { algorithm: 'HS256', audience: STATE_AUDIENCE, expiresIn: STATE_TTL });
}

/** Throws unless the state is genuine, unexpired and was issued for `provider`. */
export function verifyOAuthState(state: string, provider: IotProvider): OAuthStatePayload {
  const decoded = jwt.verify(state, signingKey(), { algorithms: ['HS256'], audience: STATE_AUDIENCE }) as OAuthStatePayload;
  if (decoded.provider !== provider) throw new Error('OAuth state was issued for a different provider');
  return {
    companyId: decoded.companyId,
    customerId: decoded.customerId,
    source: decoded.source,
    provider: decoded.provider,
  };
}
