import {
  IsString, IsOptional, IsEnum, IsNumber, IsBoolean,
  IsArray, ValidateNested, IsEmail, IsDateString, Min, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType, LineItemCategory } from '../../prisma/generated';

export class LineItemDto {
  @ApiProperty() @IsString() description!: string;
  @ApiPropertyOptional({ enum: LineItemCategory })
  @IsOptional() @IsEnum(LineItemCategory) category?: LineItemCategory;
  @ApiProperty() @IsNumber() @Min(0) quantity!: number;
  @ApiProperty() @IsNumber() @Min(0) unitPrice!: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() taxable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) sortOrder?: number;
}

export class CreateQuoteDto {
  @ApiPropertyOptional() @IsOptional() @IsString() jobId?: string;
  @ApiProperty() @IsString() customerId!: string;
  @ApiProperty() @IsString() customerName!: string;
  @ApiProperty() @IsEmail() customerEmail!: string;
  @ApiProperty() @IsString() @MaxLength(200) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsOptional() @IsEnum(DiscountType) discountType?: DiscountType;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) discountValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @MaxLength(10) taxRate?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() terms?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validUntil?: string;

  @ApiPropertyOptional({ type: [LineItemDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LineItemDto)
  lineItems?: LineItemDto[];
}
