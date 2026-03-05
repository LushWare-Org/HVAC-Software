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
  },
});
