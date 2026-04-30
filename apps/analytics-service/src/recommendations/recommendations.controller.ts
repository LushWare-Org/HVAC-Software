import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, CompanyId } from '@tscrm/auth-client';
import { IsString, IsOptional } from 'class-validator';
import { RecommendationsService } from './recommendations.service';

class ExecuteActionDto {
  @ApiProperty({ description: 'Action identifier from the recommendation', example: 'discount_20' })
  @IsString()
  action!: string;

  @ApiPropertyOptional({ description: 'Optional action parameters (discount %, segment, radius, etc.)' })
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
  @ApiOperation({ summary: 'Execute a recommended action with optional param overrides' })
  async executeAction(
    @CompanyId() companyId: string,
    @Body() body: ExecuteActionDto,
  ) {
    return this.service.executeAction(companyId, body.action, body.params ?? {});
  }

  @Get('executions')
  @ApiOperation({ summary: 'Get execution history for this company (most recent first)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max records to return (default 50)' })
  getExecutions(
    @CompanyId() companyId: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getExecutionLogs(companyId, limit ? Number(limit) : undefined);
  }
}
