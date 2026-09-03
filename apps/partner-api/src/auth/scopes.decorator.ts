import { SetMetadata } from '@nestjs/common';
import type { PartnerScope } from './scopes';

export const SCOPES_METADATA_KEY = 'partner_scopes';

export const Scopes = (...scopes: PartnerScope[]) =>
  SetMetadata(SCOPES_METADATA_KEY, scopes);
