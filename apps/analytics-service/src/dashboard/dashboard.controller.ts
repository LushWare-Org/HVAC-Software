import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, CompanyId, RolesGuard, Roles } from '@tscrm/auth-client';
import { Role } from '@tscrm/types';
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

  @Get('money')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Collected today and this week, outstanding and overdue (admins and office managers)' })
  getMoney(
    @CompanyId() companyId: string,
    @Query('todayStart') todayStart?: string,
    @Query('weekStart') weekStart?: string,
  ) {
    const parse = (v: string | undefined, fallback: Date) => {
      if (!v) return fallback;
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) throw new BadRequestException('todayStart and weekStart must be ISO dates');
      return d;
    };
    const midnight = new Date(); midnight.setUTCHours(0, 0, 0, 0);
    const weekAgo = new Date(midnight.getTime() - 6 * 86_400_000);
    return this.dashboardService.getMoney(companyId, parse(todayStart, midnight), parse(weekStart, weekAgo));
  }
}
