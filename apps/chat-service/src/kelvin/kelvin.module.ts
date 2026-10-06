import { Module } from '@nestjs/common';
import { KelvinController } from './kelvin.controller';
import { KelvinService } from './kelvin.service';

@Module({
  controllers: [KelvinController],
  providers: [{ provide: KelvinService, useFactory: () => new KelvinService() }],
})
export class KelvinModule {}
