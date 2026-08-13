import { IsOptional, IsString } from 'class-validator';

export class JobAssignedDto {
  @IsString() assignmentId!: string;
  @IsString() jobId!: string;
  @IsString() jobTitle!: string;
  @IsString() techUserId!: string;
  @IsOptional() @IsString() techName?: string;
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() scheduledStart?: string;
}
