import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { CrmClient } from './crm.client';
import { RedisCacheService } from '../redis-cache.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, RedisCacheService, CrmClient],
  exports: [JobsService],
})
export class JobsModule {}
