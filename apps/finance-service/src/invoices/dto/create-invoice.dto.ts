import {
  IsString, IsOptional, IsNumber, IsBoolean,
  IsArray, ValidateNested, IsEmail, IsDateString, Min, IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LineItemDto } from '../../quotes/dto/create-quote.dto';

export class CreateInvoiceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() quoteId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jobId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() workOrderId?: string;
  @ApiProperty() @IsString() customerId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerEmail?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) dueDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) taxRate?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() terms?: string;

  @ApiPropertyOptional({ type: [LineItemDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LineItemDto)
  lineItems?: LineItemDto[];
}
