import { Module } from '@nestjs/common';
import { SuppressionService } from './suppression.service';
import { SuppressionController } from './suppression.controller';

@Module({
  providers: [SuppressionService],
  controllers: [SuppressionController],
  exports: [SuppressionService],
})
export class SuppressionModule {}
