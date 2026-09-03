import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'partner_public_route';

export const PartnerPublic = () => SetMetadata(IS_PUBLIC_KEY, true);
