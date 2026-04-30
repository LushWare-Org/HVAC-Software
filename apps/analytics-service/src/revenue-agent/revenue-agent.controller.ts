import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@tscrm/auth-client';
import { RevenueAgentService } from './revenue-agent.service';

@ApiTags('Revenue Agent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('revenue-agent')
export class RevenueAgentController {
  constructor(private readonly service: RevenueAgentService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Revenue Agent observability KPIs' })
  getSummary() {
    return this.service.getSummary();
  }

  @Get('trends')
  @ApiOperation({ summary: 'Revenue Agent accuracy trend (time-series)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTrends(@Query('limit') limit = 30) {
    return this.service.getTrends(Number(limit));
  }

  @Get('logs')
  @ApiOperation({ summary: 'Recent Revenue Agent run logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLogs(@Query('limit') limit = 100) {
    return this.service.getLogs(Number(limit));
  }
}
