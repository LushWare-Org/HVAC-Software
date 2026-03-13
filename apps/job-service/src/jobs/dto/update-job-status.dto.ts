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

// Allowed state-machine transitions
// PAID is the only hard terminal state (money received, nothing to undo)
export const STATUS_TRANSITIONS: Record<JobStatusDto, JobStatusDto[]> = {
  [JobStatusDto.PENDING]:    [JobStatusDto.SCHEDULED, JobStatusDto.ON_HOLD, JobStatusDto.CANCELLED],
  [JobStatusDto.SCHEDULED]:  [JobStatusDto.EN_ROUTE, JobStatusDto.ON_SITE, JobStatusDto.ON_HOLD, JobStatusDto.CANCELLED],
  [JobStatusDto.EN_ROUTE]:   [JobStatusDto.ON_SITE, JobStatusDto.SCHEDULED, JobStatusDto.ON_HOLD, JobStatusDto.CANCELLED],
  [JobStatusDto.ON_SITE]:    [JobStatusDto.COMPLETED, JobStatusDto.ON_HOLD, JobStatusDto.CANCELLED],
  [JobStatusDto.COMPLETED]:  [JobStatusDto.INVOICED, JobStatusDto.CANCELLED],   // allow voiding a completed job
  [JobStatusDto.INVOICED]:   [JobStatusDto.PAID, JobStatusDto.CANCELLED],       // allow voiding a disputed invoice
  [JobStatusDto.PAID]:       [],                                                 // terminal — cannot undo payment
  [JobStatusDto.CANCELLED]:  [JobStatusDto.PENDING],                            // allow reopening a cancelled job
  [JobStatusDto.ON_HOLD]:    [JobStatusDto.SCHEDULED, JobStatusDto.CANCELLED],
};

export class UpdateJobStatusDto {
  @ApiProperty({ enum: JobStatusDto }) @IsEnum(JobStatusDto) status!: JobStatusDto;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}
