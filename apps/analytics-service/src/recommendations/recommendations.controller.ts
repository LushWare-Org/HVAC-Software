import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, CompanyId } from '@tscrm/auth-client';
import { RecommendationsService } from './recommendations.service';

@ApiTags('Recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get AI revenue recommendations sorted by priority score' })
  @ApiQuery({ name: 'forecastDays', required: false, type: Number, description: 'Forecast window in days for low-demand analysis (1, 7, 14, 30)' })
  async getRecommendations(
    @CompanyId() companyId: string,
    @Query('forecastDays') forecastDays?: string,
  ) {
    return this.service.getRecommendations(companyId, forecastDays ? Number(forecastDays) : undefined);
  }
}
