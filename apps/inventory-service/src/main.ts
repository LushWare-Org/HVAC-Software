import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.INVENTORY_PORT ?? 3007;
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
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://tscrm-demo-admin.web.app',
      'https://tscrm-demo-customer.web.app',
    ],
  });
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('T&S CRM — Inventory Management Service')
      .setDescription('Stock tracking, movements, purchase orders, availability')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
    console.log(`📖 Swagger docs: http://localhost:${port}/docs`);
  }
  await app.listen(port);
  console.log(`🚀 Inventory Service running on port ${port}`);
}
bootstrap();
