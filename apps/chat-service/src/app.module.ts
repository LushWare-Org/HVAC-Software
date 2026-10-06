import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@tscrm/auth-client';
import { ChatModule } from './chat/chat.module';
import { KelvinModule } from './kelvin/kelvin.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    AuthModule,
    HealthModule,
    KelvinModule,
    ChatModule,
  ],
})
export class AppModule {}
