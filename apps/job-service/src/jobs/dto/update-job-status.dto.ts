import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Valid job statuses that can be requested via API
export enum JobStatusDto {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  EN_ROUTE = 'EN_ROUTE',
  ON_SITE = 'ON_SITE',
  COMPLETED = 'COMPLETED',
  INVOICED = 'INVOICED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

// Allowed forward transitions per role
// e.g. a TECHNICIAN cannot set status to INVOICED
export const STATUS_TRANSITIONS: Record<JobStatusDto, JobStatusDto[]> = {
  [JobStatusDto.PENDING]:    [JobStatusDto.SCHEDULED, JobStatusDto.CANCELLED],
  [JobStatusDto.SCHEDULED]:  [JobStatusDto.EN_ROUTE, JobStatusDto.ON_HOLD, JobStatusDto.CANCELLED],
  [JobStatusDto.EN_ROUTE]:   [JobStatusDto.ON_SITE, JobStatusDto.SCHEDULED],
  [JobStatusDto.ON_SITE]:    [JobStatusDto.COMPLETED, JobStatusDto.ON_HOLD],
  [JobStatusDto.COMPLETED]:  [JobStatusDto.INVOICED],
  [JobStatusDto.INVOICED]:   [JobStatusDto.PAID],
  [JobStatusDto.PAID]:       [],
  [JobStatusDto.CANCELLED]:  [JobStatusDto.PENDING],
  [JobStatusDto.ON_HOLD]:    [JobStatusDto.SCHEDULED, JobStatusDto.CANCELLED],
};

export class UpdateJobStatusDto {
  @ApiProperty({ enum: JobStatusDto }) @IsEnum(JobStatusDto) status: JobStatusDto;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}
