import { Module } from '@nestjs/common';
import { TechnicianMetricsService } from './technician-metrics.service';
import { TechnicianMetricsController } from './technician-metrics.controller';

@Module({
  controllers: [TechnicianMetricsController],
  providers: [TechnicianMetricsService],
  exports: [TechnicianMetricsService],
})
export class TechnicianMetricsModule {}
