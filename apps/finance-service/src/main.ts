import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
  app.enableCors({ origin: ['http://localhost:3000', 'http://localhost:5173'] });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('T&S CRM — Finance Service')
      .setDescription(
        'Quotes, invoices, Stripe payments, PDF generation, job expense tracking',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
    console.log(`📖 Swagger docs: http://localhost:${port}/docs`);
  }

  await app.listen(port);
  console.log(`🚀 Finance Service running on port ${port}`);
}
bootstrap();
