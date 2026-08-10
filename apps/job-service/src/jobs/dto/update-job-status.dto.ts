import { IsBoolean, IsEnum, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
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
  // PENDING here means "descheduled back to the dispatch queue" — set when a
  // reschedule is applied, which also clears the technician (RescheduleApplyService).
  [JobStatusDto.SCHEDULED]:  [JobStatusDto.PENDING, JobStatusDto.EN_ROUTE, JobStatusDto.ON_SITE, JobStatusDto.ON_HOLD, JobStatusDto.CANCELLED],
  [JobStatusDto.EN_ROUTE]:   [JobStatusDto.ON_SITE, JobStatusDto.SCHEDULED, JobStatusDto.ON_HOLD, JobStatusDto.CANCELLED],
  [JobStatusDto.ON_SITE]:    [JobStatusDto.COMPLETED, JobStatusDto.ON_HOLD, JobStatusDto.CANCELLED],
  [JobStatusDto.COMPLETED]:  [JobStatusDto.INVOICED, JobStatusDto.CANCELLED],   // allow voiding a completed job
  [JobStatusDto.INVOICED]:   [JobStatusDto.PAID, JobStatusDto.CANCELLED],       // allow voiding a disputed invoice
  [JobStatusDto.PAID]:       [],                                                 // terminal — cannot undo payment
  [JobStatusDto.CANCELLED]:  [JobStatusDto.PENDING],                            // allow reopening a cancelled job
  [JobStatusDto.ON_HOLD]:    [JobStatusDto.SCHEDULED, JobStatusDto.CANCELLED],
};

/**
 * A customer changing the time they asked for, before anyone has committed to it.
 *
 * Separate from the reschedule negotiation on purpose. While a job is PENDING
 * and unassigned, `scheduledStart` is only the preference the customer typed at
 * booking — nobody has promised it, no technician is holding the slot. Making
 * them open a negotiation and wait for approval to change their own unacted-on
 * preference is pure friction. Once a technician is assigned, it becomes a
 * commitment and must go through RescheduleModule instead.
 */
export class UpdatePreferredTimeDto {
  @ApiProperty({ description: 'Requested start, ISO 8601.' })
  @IsISO8601() preferredStart!: string;

  @ApiPropertyOptional({ description: 'Requested end. Defaults to start + the job estimate.' })
  @IsOptional() @IsISO8601() preferredEnd?: string;

  @ApiPropertyOptional({ description: "'morning' | 'afternoon' | 'evening' — display label only." })
  @IsOptional() @IsString() window?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class UpdateJobStatusDto {
  @ApiProperty({ enum: JobStatusDto }) @IsEnum(JobStatusDto) status!: JobStatusDto;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cancellationReason?: string;
  // Admin-only correction: bypass STATUS_TRANSITIONS to fix a mis-set status
  // (e.g. a technician tapped the wrong button). Enforced server-side in
  // JobsService.updateStatus — never trust this flag off the wire alone.
  @ApiPropertyOptional({ description: 'Admin override — bypasses the state machine. Requires super_admin/company_admin/office_manager.' })
  @IsOptional() @IsBoolean() force?: boolean;
}
