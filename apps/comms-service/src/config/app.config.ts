export default () => ({
  port: parseInt(process.env.COMMS_PORT ?? '3005', 10),
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    fromPhone: process.env.TWILIO_FROM_PHONE ?? '',
    webhookSecret: process.env.TWILIO_WEBHOOK_SECRET ?? '',
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY ?? '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL ?? 'no-reply@tscrm.com',
    fromName: process.env.SENDGRID_FROM_NAME ?? 'T&S Services',
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
  mongodb: {
    uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/tscrm',
  },
  app: {
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  },
});
