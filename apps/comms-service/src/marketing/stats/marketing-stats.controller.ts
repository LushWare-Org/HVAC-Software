import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MarketingStatsService, StatsRange } from './marketing-stats.service';
import { JwtAuthGuard, RolesGuard, CurrentUser } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';

@ApiTags('marketing-stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('m/stats')
export class MarketingStatsController {
  constructor(private readonly svc: MarketingStatsService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Marketing KPI cards — sent/delivered/opened/clicked/reviews' })
  getKpis(
    @CurrentUser() user: AuthUser,
    @Query('range') range: StatsRange = '30d',
  ) {
    return this.svc.getKpis(user.companyId, range);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Per-campaign stats list' })
  getCampaignStats(
    @CurrentUser() user: AuthUser,
    @Query('range') range: StatsRange = '30d',
  ) {
    return this.svc.getCampaignStats(user.companyId, range);
  }

  @Get('attribution')
  @ApiOperation({ summary: 'Attribution stats — clicks, review conversions, automation sends' })
  getAttributionStats(
    @CurrentUser() user: AuthUser,
    @Query('range') range: StatsRange = '30d',
  ) {
    return this.svc.getAttributionStats(user.companyId, range);
  }

  @Get('campaigns/:id/funnel')
  @ApiOperation({ summary: 'Sent → delivered → opened → clicked → failed funnel for one campaign' })
  getCampaignFunnel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.svc.getCampaignFunnel(user.companyId, id);
  }
}
