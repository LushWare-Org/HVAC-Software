import { PartnerContext } from '../auth/partner-context';

export function isSandbox(partner: Pick<PartnerContext, 'environment'>): boolean {
  return partner.environment === 'SANDBOX';
}

/** Marker returned on every simulated side effect, so it is never mistaken
 * for the real thing. */
export const SANDBOX_NOTICE =
  'Sandbox key: nothing was actually sent. Use a live key for real delivery.';
