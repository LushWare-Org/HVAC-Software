import {
  IsString, IsOptional, IsEnum, IsNumber, IsBoolean,
  IsArray, ValidateNested, IsEmail, IsDateString, Min, MaxLength,
} from 'class-validator';
// Note: MaxLength is kept in import for the title field
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType, LineItemCategory } from '../../prisma/generated';

const LINE_ITEM_CATEGORY_ALIASES: Record<string, LineItemCategory> = {
  SERVICE: LineItemCategory.LABOUR,
  LABOR: LineItemCategory.LABOUR,
  PART: LineItemCategory.PARTS,
  MATERIAL: LineItemCategory.MATERIALS,
  EQUIPMENT: LineItemCategory.EQUIPMENT_RENTAL,
};

function normalizeLineItemCategory(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toUpperCase().replace(/\s+/g, '_');
  return LINE_ITEM_CATEGORY_ALIASES[normalized] ?? normalized;
}

export class LineItemDto {
  @ApiProperty() @IsString() description!: string;
  @ApiPropertyOptional({ enum: LineItemCategory })
  @Transform(({ value }) => normalizeLineItemCategory(value))
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
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) taxRate?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() terms?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validUntil?: string;

  @ApiPropertyOptional({ type: [LineItemDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LineItemDto)
  lineItems?: LineItemDto[];
}
