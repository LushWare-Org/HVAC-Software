import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.CRM_PORT ?? 3001;
  app.get(PrismaService).enableShutdownHooks(app);

  // ---- Global validation pipe ----
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,       // auto-transform payloads to DTO instances
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ---- CORS (dev — Nginx handles prod) ----
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  });

  // ---- Swagger API docs ----
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('T&S CRM — CRM Service')
      .setDescription('Customer, lead, agreement, and booking management API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    console.log(`📖 Swagger docs: http://localhost:${port}/docs`);
  }

  await app.listen(port);
  console.log(`🚀 CRM Service running on port ${port}`);
}

bootstrap();
