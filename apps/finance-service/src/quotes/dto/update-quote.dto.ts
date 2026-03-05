import { IsOptional, IsString, IsEnum, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType, QuoteStatus } from '../../prisma/generated';
import { LineItemDto } from './create-quote.dto';

export class UpdateQuoteDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() terms?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() validUntil?: string;

  @ApiPropertyOptional({ enum: QuoteStatus })
  @IsOptional() @IsEnum(QuoteStatus) status?: QuoteStatus;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsOptional() @IsEnum(DiscountType) discountType?: DiscountType;
  @ApiPropertyOptional() @IsOptional() @IsNumber() discountValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() taxRate?: number;

  @ApiPropertyOptional({ type: [LineItemDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LineItemDto)
  lineItems?: LineItemDto[];
}
