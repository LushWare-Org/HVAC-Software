import { registerAs } from '@nestjs/config';
import { requireInternalApiKey } from '@tscrm/auth-client';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3006', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  // JWT (shared with all services — same Auth0 domain)
  auth0Domain: process.env.AUTH0_DOMAIN ?? '',
  auth0Audience: process.env.AUTH0_AUDIENCE ?? '',

  // Database (read-only analytics user)
  databaseUrl: process.env.ANALYTICS_DATABASE_URL ?? '',

  // Internal API key (for service-to-service calls from admin dashboard)
  internalApiKey: requireInternalApiKey(),
}));
