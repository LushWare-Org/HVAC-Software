import { Module } from '@nestjs/common';
import { RedisCacheService } from '../redis-cache.service';
import { BriefController } from './brief.controller';
import { BriefService } from './brief.service';

@Module({
  controllers: [BriefController],
  providers: [BriefService, RedisCacheService],
})
export class BriefModule {}
