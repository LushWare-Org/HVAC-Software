import { Module } from '@nestjs/common';
import { RevenueAgentController } from './revenue-agent.controller';
import { RevenueAgentService } from './revenue-agent.service';

@Module({
  controllers: [RevenueAgentController],
  providers: [RevenueAgentService],
})
export class RevenueAgentModule {}
