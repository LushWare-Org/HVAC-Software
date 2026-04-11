import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { RedisCacheService } from '../redis-cache.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, RedisCacheService],
  exports: [JobsService],
})
export class JobsModule {}
