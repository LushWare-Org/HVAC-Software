import 'reflect-metadata';
import * as express from 'express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow larger payloads for requests with base64 PDF attachments.
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));

  // Twilio inbound webhook requires raw body to pass through unchanged
  // (Twilio signature is computed over the raw request body)
  app.use('/webhooks/twilio', express.raw({ type: '*/*' }));
  const port = process.env.COMMS_PORT ?? 3005;
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://tscrm-demo-admin.web.app',
    'https://tscrm-demo-customer.web.app',
  ],
  credentials: true,});
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('T&S CRM — Communications Service')
      .setDescription('SMS, email, push notifications, automation workflows')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
    console.log(`📖 Swagger docs: http://localhost:${port}/docs`);
  }
  await app.listen(port);
  console.log(`🚀 Communications Service running on port ${port}`);
}
bootstrap();
