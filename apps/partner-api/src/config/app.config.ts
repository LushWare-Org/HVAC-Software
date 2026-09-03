import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PARTNER_PORT ?? '3009', 10),
  defaultRateLimitPerMin: parseInt(process.env.PARTNER_RATE_LIMIT_PER_MIN ?? '60', 10),
  lastUsedWriteIntervalSec: parseInt(
    process.env.PARTNER_LAST_USED_INTERVAL_SEC ?? '60',
    10,
  ),
  publicDocs: process.env.PARTNER_DOCS_PUBLIC === 'true',
}));
