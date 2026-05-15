import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateMarketingSettingsDto {
  @IsOptional() @IsBoolean()
  globalEnabled?: boolean;

  @IsOptional() @IsBoolean()
  reviewRequestsEnabled?: boolean;

  @IsOptional() @IsBoolean()
  equipmentAutomationsEnabled?: boolean;

  @IsOptional() @IsBoolean()
  winbackEnabled?: boolean;

  @IsOptional() @IsInt() @Min(1) @Max(20)
  frequencyCapPerDay?: number;

  @IsOptional() @IsInt() @Min(1) @Max(50)
  frequencyCapPerWeek?: number;

  @IsOptional() @IsString()
  defaultSenderName?: string;
}
