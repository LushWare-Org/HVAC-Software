import { Module } from '@nestjs/common';
import { KelvinController } from './kelvin.controller';
import { KelvinLogService } from './kelvin-log.service';
import { KelvinProcessor } from './kelvin.processor';

@Module({
  controllers: [KelvinController],
  providers: [KelvinLogService, KelvinProcessor],
})
export class KelvinModule {}
