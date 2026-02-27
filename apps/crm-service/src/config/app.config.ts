import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.CRM_PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  auth0: {
    domain: process.env.AUTH0_DOMAIN,
    audience: process.env.AUTH0_AUDIENCE,
  },
  database: {
    url: process.env.CRM_DATABASE_URL,
  },
}));
