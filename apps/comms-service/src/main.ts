import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.COMMS_PORT ?? 3005;
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: ['http://localhost:3000', 'http://localhost:5173'] });
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
