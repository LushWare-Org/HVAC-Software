import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PARTNER_PORT ?? 3009;
  app.get(PrismaService).enableShutdownHooks(app);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://tscrm-demo-admin.web.app',
    ],
  });

  const docsEnabled =
    process.env.NODE_ENV !== 'production' || process.env.PARTNER_DOCS_PUBLIC === 'true';

  if (docsEnabled) {
    const config = new DocumentBuilder()
      .setTitle('HVACtor — Partner API')
      .setDescription(
        [
          'Integration surface for external agents (AI voice, chat, dialer): identify one',
          'inbound caller, book work, discuss and send invoices and quotes, and take payment.',
          '',
          '**Read the [integration guide](/guide) first** — it covers authentication, the',
          'sandbox, scopes, rate limits, webhooks, error handling and the capability matrix.',
          'This page is the endpoint-by-endpoint reference.',
          '',
          '### Authentication',
          'Send your key in the `x-api-key` header on every `/v1/*` request. Click',
          '**Authorize** above to try endpoints with your own key. A key is bound to one',
          'company, one environment (`pk_live_` or `pk_test_`) and an explicit scope list;',
          'a missing scope returns `403` naming it.',
          '',
          '### Two rules that shape the whole API',
          '1. **One caller at a time** — there is no customer list, search or export endpoint.',
          '2. **A human confirms anything you write** — bookings are created `PENDING`, and',
          'outbound messages can only reach contact details already on the customer record.',
          '',
          'Machine-readable summary: [/capabilities](/capabilities).',
        ].join('\n'),
      )
      .setVersion('1.0')
      // Empty rather than a placeholder address: a vendor writing to a fake
      // support mailbox and hearing nothing is worse than seeing no address.
      .setContact('Partner API support', '/guide', process.env.PARTNER_SUPPORT_EMAIL ?? '')
      .setExternalDoc('Integration guide', '/guide')
      .addServer('/api/partner', 'Through the gateway (production and staging)')
      .addApiKey(
        {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header',
          description: 'Your partner key: pk_live_… or pk_test_… (sandbox).',
        },
        'partner-key',
      )
      .addBearerAuth()
      .addTag('v1', 'Key identity — start here')
      .addTag('v1 — Callers', 'Resolve the person on the phone to exactly one customer')
      .addTag('v1 — Bookings', 'Bookable slots, and creating, rescheduling and cancelling appointments')
      .addTag('v1 — Documents', 'Invoice and quote status, and sending them to the customer')
      .addTag('v1 — Payments', 'Stripe-hosted payment links for unpaid invoices')
      .addTag('v1 — Webhooks', 'Signed event subscriptions and their delivery log')
      .build();

    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config), {
      customSiteTitle: 'HVACtor Partner API — Reference',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        tryItOutEnabled: true,
      },
    });
    console.log(`📖 Partner API reference: http://localhost:${port}/docs`);
    console.log(`📘 Partner API guide:     http://localhost:${port}/guide`);
  }

  await app.listen(port);
  console.log(`🚀 Partner API running on port ${port}`);
}
bootstrap();
