import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.INVENTORY_PORT ?? '3007', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  auth0: {
    domain: process.env.AUTH0_DOMAIN,
    audience: process.env.AUTH0_AUDIENCE,
  },
  database: {
    url: process.env.INVENTORY_DATABASE_URL,
  },
}));
