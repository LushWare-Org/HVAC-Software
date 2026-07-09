import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Internal payload from scheduling-service when a technician is marked EN_ROUTE.
 * Contact fields are optional — each channel skips gracefully when missing.
 */
export class EnRouteNotificationDto {
  @IsString() @IsNotEmpty()
  assignmentId!: string;

  @IsString() @IsNotEmpty()
  jobId!: string;

  @IsString() @IsNotEmpty()
  jobTitle!: string;

  @IsOptional() @IsString()
  serviceAddress?: string;

  @IsOptional() @IsString()
  customerName?: string;

  @IsOptional() @IsString()
  customerEmail?: string;

  @IsOptional() @IsString()
  customerPhone?: string;

  /** crm CompanyUser id of the technician (for avatar lookup). */
  @IsString() @IsNotEmpty()
  techUserId!: string;

  @IsString() @IsNotEmpty()
  techName!: string;

  /** Arrival window (ISO). Both absent → "on the way" copy without a time. */
  @IsOptional() @IsISO8601()
  etaStart?: string;

  @IsOptional() @IsISO8601()
  etaEnd?: string;
}
