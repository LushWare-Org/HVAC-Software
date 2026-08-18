import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateTaxRatePresetDto {
  @ApiProperty({ example: 'VAT 15%' })
  @IsString()
  @MaxLength(60)
  name!: string;

  @ApiProperty({ example: 0.15, description: 'Decimal fraction, e.g. 0.15 for 15%' })
  @IsNumber()
  @Min(0)
  @Max(1)
  rate!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateTaxRatePresetDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(1) rate?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
}
