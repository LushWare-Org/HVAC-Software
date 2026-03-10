import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, CompanyId } from '@tscrm/auth-client';
import { JobsAnalyticsService } from './jobs-analytics.service';
import { DateRangeDto, GranularityEnum } from '../dashboard/dto/dashboard.dto';

@ApiTags('Jobs Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs-analytics')
export class JobsAnalyticsController {
  constructor(private readonly jobsAnalyticsService: JobsAnalyticsService) {}

  @Get('by-status')
  @ApiOperation({ summary: 'Job counts grouped by status' })
  getByStatus(@CompanyId() companyId: string, @Query() dto: DateRangeDto) {
    return this.jobsAnalyticsService.getByStatus(companyId, dto);
  }

  @Get('by-trade')
  @ApiOperation({ summary: 'Job volume and revenue by trade type' })
  getByTradeType(@CompanyId() companyId: string, @Query() dto: DateRangeDto) {
    return this.jobsAnalyticsService.getByTradeType(companyId, dto);
  }

  @Get('by-zone')
  @ApiOperation({ summary: 'Job volume and revenue by service city/zip' })
  @ApiQuery({ name: 'groupBy', enum: ['city', 'zip'], required: false })
  getByZone(
    @CompanyId() companyId: string,
    @Query() dto: DateRangeDto,
    @Query('groupBy') groupBy: 'city' | 'zip' = 'city',
  ) {
    return this.jobsAnalyticsService.getByZone(companyId, dto, groupBy);
  }

  @Get('completion-rates')
  @ApiOperation({ summary: 'Job completion, cancellation and on-hold rates' })
  getCompletionRates(@CompanyId() companyId: string, @Query() dto: DateRangeDto) {
    return this.jobsAnalyticsService.getCompletionRates(companyId, dto);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Job volume trend (created / completed / cancelled)' })
  @ApiQuery({ name: 'granularity', enum: GranularityEnum, required: false })
  getTrends(
    @CompanyId() companyId: string,
    @Query() dto: DateRangeDto,
    @Query('granularity') granularity: GranularityEnum = GranularityEnum.WEEK,
  ) {
    return this.jobsAnalyticsService.getTrends(companyId, dto, granularity);
  }
}
