import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, CompanyId } from '@tscrm/auth-client';
import { DashboardService } from './dashboard.service';
import { DateRangeDto } from './dto/dashboard.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Get KPI summary cards for the main dashboard' })
  getKpis(
    @CompanyId() companyId: string,
    @Query() dto: DateRangeDto,
  ) {
    return this.dashboardService.getKpis(companyId, dto);
  }
}
