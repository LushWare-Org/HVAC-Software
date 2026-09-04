import {
  IsArray, IsBoolean, IsISO8601, IsNotEmpty, IsOptional, IsString, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** One technician on the job's crew. */
export class EnRouteCrewMemberDto {
  @IsString() @IsNotEmpty() userId!: string;
  @IsString() @IsNotEmpty() name!: string;
  @IsBoolean() isLead!: boolean;
}

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

  /**
   * The full crew, when the job has one. Optional: a solo job omits it and the
   * email renders exactly as before.
   *
   * ValidateNested + Type are load-bearing. Without them `whitelist: true`
   * silently strips every element and the customer is told about nobody.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnRouteCrewMemberDto)
  crew?: EnRouteCrewMemberDto[];
}
