import {
  IsString, IsOptional, IsEnum, IsArray,
  IsDateString, IsNumber, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum JobPriorityDto {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY',
}

export class CreateJobDto {
  @ApiProperty() @IsString() customerId!: string;
  @ApiProperty() @IsString() customerName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerEmail?: string;

  @ApiProperty() @IsString() @MaxLength(300) serviceAddress!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serviceCity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serviceState?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serviceZip?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() serviceLatitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() serviceLongitude?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() jobTypeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() templateId?: string;

  @ApiProperty() @IsString() @MaxLength(200) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ enum: JobPriorityDto })
  @IsOptional() @IsEnum(JobPriorityDto) priority?: JobPriorityDto;

  @ApiPropertyOptional() @IsOptional() @IsString() assignedToId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assignedToName?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledStart?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledEnd?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedDurationMins?: number;
  @ApiPropertyOptional({ description: 'Forecasted dollar value of the job; falls back to invoice total once billed.' })
  @IsOptional() @IsNumber() estimatedValue?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() internalNotes?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];

  // Custom field values to save on creation (optional)
  @ApiPropertyOptional({
    description: 'Array of custom field values: { fieldDefId, value }',
    type: 'array',
  })
  @IsOptional() @IsArray() customFields?: Array<{ fieldDefId: string; value: unknown }>;
}
