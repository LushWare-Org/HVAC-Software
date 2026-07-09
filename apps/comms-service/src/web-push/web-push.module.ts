import { Module } from '@nestjs/common';
import { WebPushService } from './web-push.service';
import { WebPushController } from './web-push.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WebPushService],
  controllers: [WebPushController],
  exports: [WebPushService],
})
export class WebPushModule {}
