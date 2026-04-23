import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard, CompanyId } from '@tscrm/auth-client';
import { IsString, IsOptional } from 'class-validator';
import { RecommendationsService } from './recommendations.service';

class ExecuteActionDto {
  @ApiProperty({ description: 'Action identifier from the recommendation', example: 'discount_20' })
  @IsString()
  action!: string;

  @ApiPropertyOptional({ description: 'Optional action parameters' })
  @IsOptional()
  params?: Record<string, unknown>;
}

@ApiTags('Recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get AI revenue recommendations sorted by priority score' })
  getRecommendations(@CompanyId() companyId: string) {
    return this.service.getRecommendations(companyId);
  }

  @Post('execute')
  @ApiOperation({ summary: 'Execute a recommended action' })
  executeAction(
    @CompanyId() companyId: string,
    @Body() body: ExecuteActionDto,
  ) {
    return this.service.executeAction(companyId, body.action, body.params ?? {});
  }
}
