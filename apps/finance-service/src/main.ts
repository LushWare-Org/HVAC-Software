import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ActivityLogInterceptor } from '@tscrm/activity-log';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // rawBody: true is required for Stripe webhook signature verification.
    rawBody: true,
  });

  const port = process.env.FINANCE_PORT ?? 3004;
  app.get(PrismaService).enableShutdownHooks(app);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ActivityLogInterceptor('finance'));
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://tscrm-demo-admin.web.app',
      'https://tscrm-demo-customer.web.app',
    ],
  });

  if (process.env.NODE_ENV !== 'production') {
    const isBypass = process.env.BYPASS_AUTH === 'true';
    const config = new DocumentBuilder()
      .setTitle('T&S CRM — Finance Service')
      .setDescription(
        isBypass
          ? 'BYPASS_AUTH=true — click Authorize and enter your Company ID in the x-test-company-id field (e.g. co-demo-001)'
          : 'Quotes, invoices, Stripe payments, PDF generation, job expense tracking',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', in: 'header', name: 'x-test-company-id', description: 'Dev bypass: enter company ID (e.g. co-demo-001)' }, 'x-test-company-id')
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
    console.log(`📖 Swagger docs: http://localhost:${port}/docs`);
  }

  await app.listen(port);
  console.log(`🚀 Finance Service running on port ${port}`);
}
bootstrap();
