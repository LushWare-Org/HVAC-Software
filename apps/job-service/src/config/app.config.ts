import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.JOBS_PORT ?? '3002', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  auth0: {
    domain: process.env.AUTH0_DOMAIN,
    audience: process.env.AUTH0_AUDIENCE,
  },
  database: {
    url: process.env.JOBS_DATABASE_URL,
  },
}));
