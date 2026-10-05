import { Module } from '@nestjs/common';
import { AiUsageController } from './ai-usage.controller';
import { AiUsageProcessor } from './ai-usage.processor';
import { AiUsageService } from './ai-usage.service';

@Module({
  controllers: [AiUsageController],
  providers: [AiUsageService, AiUsageProcessor],
  exports: [AiUsageService],
})
export class AiUsageModule {}
