import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, CompanyId } from '@tscrm/auth-client';
import { CustomerAnalyticsService } from './customer-analytics.service';
import { DateRangeDto } from '../dashboard/dto/dashboard.dto';

@ApiTags('Customer Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customer-analytics')
export class CustomerAnalyticsController {
  constructor(private readonly customerAnalyticsService: CustomerAnalyticsService) {}

  @Get('top-customers')
  @ApiOperation({ summary: 'Top N customers by lifetime revenue' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopCustomers(
    @CompanyId() companyId: string,
    @Query() dto: DateRangeDto,
    @Query('limit') limit = 20,
  ) {
    return this.customerAnalyticsService.getTopCustomers(companyId, dto, Number(limit));
  }

  @Get('acquisition-sources')
  @ApiOperation({ summary: 'Lead acquisition sources with conversion rates' })
  getAcquisitionSources(@CompanyId() companyId: string, @Query() dto: DateRangeDto) {
    return this.customerAnalyticsService.getAcquisitionSources(companyId, dto);
  }

  @Get('churn-signals')
  @ApiOperation({ summary: 'Customers at risk of churn (no job in N days)' })
  @ApiQuery({ name: 'inactiveDays', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getChurnSignals(
    @CompanyId() companyId: string,
    @Query('inactiveDays') inactiveDays = 90,
    @Query('limit') limit = 50,
  ) {
    return this.customerAnalyticsService.getChurnSignals(
      companyId,
      Number(inactiveDays),
      Number(limit),
    );
  }

  @Get('segments')
  @ApiOperation({ summary: 'Customer segment breakdown (residential vs commercial)' })
  getSegmentSummary(@CompanyId() companyId: string, @Query() dto: DateRangeDto) {
    return this.customerAnalyticsService.getSegmentSummary(companyId, dto);
  }
}
