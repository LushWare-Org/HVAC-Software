import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

export class ConnectBotDto { @IsString() @MaxLength(200) token!: string }
export class EnableBotDto { @IsOptional() @IsBoolean() enabled?: boolean; @IsOptional() @IsBoolean() officeAlerts?: boolean }
export class UpdateMeDto {
  @IsOptional() @IsBoolean() alsoPush?: boolean;
  @IsOptional() @IsIn(['all', 'mine']) alertScope?: 'all' | 'mine';
  /** "HH:MM", or null to switch quiet hours off. */
  @IsOptional() @ValidateIf((_, v) => v !== null) @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) quietFrom?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) quietTo?: string | null;
}
export class InviteDto {
  @IsOptional() @IsArray() @ArrayMaxSize(1000) @IsString({ each: true }) customerIds?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(1000) @IsString({ each: true }) userIds?: string[];
  @IsOptional() @IsBoolean() allCustomers?: boolean;
  @IsOptional() @IsString() @MaxLength(600) note?: string;
}
