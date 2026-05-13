import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { SuppressionModule } from '../suppression/suppression.module';

@Module({
  imports: [SuppressionModule],
  controllers: [PublicController],
})
export class PublicModule {}
