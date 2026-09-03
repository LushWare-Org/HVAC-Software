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
      .setTitle('T&S CRM — Partner API')
      .setDescription(
        'Outward-facing integration surface for external partners (e.g. AI voice agents). ' +
          'Authenticate with the `x-api-key` header. Every key is bound to one company and ' +
          'to an explicit scope list.',
      )
      .setVersion('1.0')
      .addApiKey(
        { type: 'apiKey', name: 'x-api-key', in: 'header' },
        'partner-key',
      )
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
    console.log(`📖 Partner API docs: http://localhost:${port}/docs`);
  }

  await app.listen(port);
  console.log(`🚀 Partner API running on port ${port}`);
}
bootstrap();
