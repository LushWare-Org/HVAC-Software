export default () => ({
  port: parseInt(process.env.FINANCE_PORT ?? '3004', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    publicKey: process.env.STRIPE_PUBLIC_KEY ?? '',
  },
  aws: {
    region: process.env.AWS_REGION ?? 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET ?? '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
  app: {
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    customerPortalUrl: process.env.CUSTOMER_PORTAL_URL ?? 'https://tscrm-demo-customer.web.app',
  },
  quickbooks: {
    clientId: process.env.QB_CLIENT_ID ?? '',
    clientSecret: process.env.QB_CLIENT_SECRET ?? '',
    redirectUri: process.env.QB_REDIRECT_URI ?? 'http://localhost:3004/quickbooks/callback',
    environment: process.env.QB_ENVIRONMENT ?? 'sandbox',
  },
});
