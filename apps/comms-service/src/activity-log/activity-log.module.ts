import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CompanyNameCacheService } from './company-name-cache.service';
import { ActivityLogProcessor } from './activity-log.processor';
import { ActivityGateway } from './activity.gateway';
import { ActivityLogController, ActivityLogIngestController } from './activity-log.controller';
import { ActivityLogCleanupService } from './activity-log-cleanup.service';

@Module({
  imports: [PrismaModule],
  controllers: [ActivityLogController, ActivityLogIngestController],
  providers: [CompanyNameCacheService, ActivityLogProcessor, ActivityGateway, ActivityLogCleanupService],
  exports: [ActivityGateway],
})
export class ActivityLogModule {}
