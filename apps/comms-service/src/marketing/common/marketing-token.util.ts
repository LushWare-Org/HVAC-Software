import jwt from 'jsonwebtoken';

const SECRET = process.env.MARKETING_TOKEN_SECRET ?? 'dev-marketing-secret-change-in-prod';

export interface UnsubscribeTokenPayload {
  type: 'unsub';
  companyId: string;
  customerId?: string;
  channel: 'EMAIL' | 'SMS';
  address: string;
  sendJobId?: string;
}

export interface ClickTokenPayload {
  type: 'click';
  sendJobId: string;
  destinationUrl: string;
}

export interface ReviewClickTokenPayload {
  type: 'review-click';
  companyId: string;
  customerId: string;
  jobId: string;
}

export type MarketingTokenPayload = UnsubscribeTokenPayload | ClickTokenPayload | ReviewClickTokenPayload;

export function signMarketingToken(payload: MarketingTokenPayload, expiresIn: jwt.SignOptions['expiresIn'] = '90d'): string {
  return jwt.sign(payload as object, SECRET, { expiresIn });
}

export function verifyMarketingToken(token: string): MarketingTokenPayload {
  return jwt.verify(token, SECRET) as MarketingTokenPayload;
}
