import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DateRangeDto {
  @ApiPropertyOptional({ example: '2024-01-01', description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export enum GranularityEnum {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}
