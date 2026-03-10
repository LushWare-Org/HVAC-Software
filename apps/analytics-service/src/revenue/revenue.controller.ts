import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, CompanyId } from '@tscrm/auth-client';
import { RevenueService } from './revenue.service';
import { DateRangeDto, GranularityEnum } from '../dashboard/dto/dashboard.dto';

@ApiTags('Revenue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get('series')
  @ApiOperation({ summary: 'Revenue time-series (day/week/month/quarter/year)' })
  @ApiQuery({ name: 'granularity', enum: GranularityEnum, required: false })
  getSeries(
    @CompanyId() companyId: string,
    @Query() dto: DateRangeDto,
    @Query('granularity') granularity: GranularityEnum = GranularityEnum.MONTH,
  ) {
    return this.revenueService.getSeries(companyId, dto, granularity);
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Revenue breakdown by line-item category' })
  getByCategory(
    @CompanyId() companyId: string,
    @Query() dto: DateRangeDto,
  ) {
    return this.revenueService.getByCategory(companyId, dto);
  }

  @Get('top-jobs')
  @ApiOperation({ summary: 'Top N highest-revenue jobs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopJobs(
    @CompanyId() companyId: string,
    @Query() dto: DateRangeDto,
    @Query('limit') limit = 10,
  ) {
    return this.revenueService.getTopJobs(companyId, dto, Number(limit));
  }

  @Get('summary')
  @ApiOperation({ summary: 'Revenue summary: collected, outstanding, overdue' })
  getSummary(
    @CompanyId() companyId: string,
    @Query() dto: DateRangeDto,
  ) {
    return this.revenueService.getSummary(companyId, dto);
  }
}
