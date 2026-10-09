import { Module } from '@nestjs/common';
import { ProjectMoneyController } from './project-money.controller';
import { ProjectMoneyService } from './project-money.service';

@Module({
  controllers: [ProjectMoneyController],
  providers: [ProjectMoneyService],
})
export class ProjectMoneyModule {}
