import {
  IsString, IsOptional, IsEnum, IsArray,
  IsDateString, IsNumber, MaxLength, IsBoolean, Length,
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
  @ApiPropertyOptional({ example: 'USD', description: 'ISO 4217 code; defaults to the tenant currency when omitted' })
  @IsOptional() @IsString() @Length(3, 3) currency?: string;

  @ApiPropertyOptional({ description: 'crm.service_agreements id when auto-created from an agreement' })
  @IsOptional() @IsString() agreementId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAgreementJob?: boolean;
  @ApiPropertyOptional({ description: 'crm.projects id — reserved crew capacity + roll-up filtering' })
  @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional({ description: 'crm.project_components id — which project component this job is for' })
  @IsOptional() @IsString() componentId?: string;
  @ApiPropertyOptional({ description: 'crm.equipment id — optional: which specific unit was serviced (service log)' })
  @IsOptional() @IsString() equipmentId?: string;

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
