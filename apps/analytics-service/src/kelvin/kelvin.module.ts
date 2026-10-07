import { Module } from '@nestjs/common';
import { KelvinController } from './kelvin.controller';
import { KelvinLogService } from './kelvin-log.service';
import { KelvinProcessor } from './kelvin.processor';
import { KelvinMindService } from './kelvin-mind.service';

@Module({
  controllers: [KelvinController],
  providers: [KelvinLogService, KelvinMindService, KelvinProcessor],
})
export class KelvinModule {}
