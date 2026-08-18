import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreatePaymentTermsPresetDto {
  @ApiProperty({ example: 'Net 30' })
  @IsString()
  @MaxLength(60)
  name!: string;

  @ApiProperty({ example: 30, description: 'Days from issue date until due; 0 = Due on Receipt' })
  @IsInt()
  @Min(0)
  @Max(365)
  days!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePaymentTermsPresetDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(365) days?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
}
