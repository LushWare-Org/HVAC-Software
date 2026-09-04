export default () => ({
  port: parseInt(process.env.COMMS_PORT ?? '3005', 10),
  // Shared secret for service-to-service calls into automation/events/* (job-service,
  // finance-service). Must match INTERNAL_API_KEY in the calling service's .env.
  internalApiKey: process.env.INTERNAL_API_KEY ?? '',
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    fromPhone: process.env.TWILIO_FROM_PHONE ?? process.env.TWILIO_PHONE_NUMBER ?? '',
    webhookSecret: process.env.TWILIO_WEBHOOK_SECRET ?? '',
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY ?? '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL ?? 'no-reply@tscrm.com',
    fromName: process.env.SENDGRID_FROM_NAME ?? 'HVACtor.ai',
  },
  email: {
    provider: (process.env.EMAIL_PROVIDER ?? 'auto').toLowerCase(), // auto | smtp | sendgrid
  },
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: (process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    fromEmail: process.env.SMTP_FROM_EMAIL ?? process.env.SENDGRID_FROM_EMAIL ?? 'no-reply@tscrm.com',
    fromName: process.env.SMTP_FROM_NAME ?? process.env.SENDGRID_FROM_NAME ?? 'HVACtor.ai',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY ?? '',
    privateKey: process.env.VAPID_PRIVATE_KEY ?? '',
    subject: process.env.VAPID_SUBJECT ?? 'mailto:admin@tscrm.com',
  },
  mongodb: {
    uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/tscrm',
  },
  app: {
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  },
});
