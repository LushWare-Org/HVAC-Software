import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard, CompanyId } from '@tscrm/auth-client';
import { TechnicianMetricsService } from './technician-metrics.service';
import { DateRangeDto } from '../dashboard/dto/dashboard.dto';

@ApiTags('Technician Metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('technician-metrics')
export class TechnicianMetricsController {
  constructor(private readonly technicianMetricsService: TechnicianMetricsService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Technician performance leaderboard' })
  getLeaderboard(
    @CompanyId() companyId: string,
    @Query() dto: DateRangeDto,
    @Query('limit') limit = 20,
  ) {
    return this.technicianMetricsService.getLeaderboard(companyId, dto, Number(limit));
  }

  @Get(':technicianId')
  @ApiOperation({ summary: 'Detailed metrics for a single technician' })
  @ApiParam({ name: 'technicianId', description: 'Auth0 user ID of the technician' })
  getMetrics(
    @CompanyId() companyId: string,
    @Param('technicianId') technicianId: string,
    @Query() dto: DateRangeDto,
  ) {
    return this.technicianMetricsService.getMetrics(companyId, technicianId, dto);
  }
}
