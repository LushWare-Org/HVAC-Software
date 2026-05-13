import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class TriggerReviewRequestDto {
  @IsString() @IsNotEmpty() companyId!: string;
  @IsString() @IsNotEmpty() customerId!: string;
  @IsString() @IsNotEmpty() jobId!: string;
  @IsString() @IsNotEmpty() customerName!: string;
  @IsOptional() @IsString() customerPhone?: string;
  @IsOptional() @IsString() customerEmail?: string;

  // Churn gate inputs (collected from CRM/jobs; pass-through from job-completed event)
  @IsOptional() @IsNumber() @Min(0) daysSinceLastService?: number;
  @IsOptional() @IsNumber() @Min(0) serviceCountLastYear?: number;
  @IsOptional() @IsNumber() @Min(0) avgMonthlySpend?: number;
  @IsOptional() @IsNumber() @Min(0) customerTenureDays?: number;

  // GBP review link (company-configured)
  @IsOptional() @IsString() reviewLink?: string;
}

export class ReviewRequestResponseDto {
  id!: string;
  status!: string;
  gateScore!: number | null;
  gatePassed!: boolean;
  smsSent!: boolean;
  emailQueued!: boolean;
}
