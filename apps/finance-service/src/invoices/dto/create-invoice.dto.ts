import {
  IsString, IsOptional, IsNumber, IsBoolean,
  IsArray, ValidateNested, IsEmail, IsDateString, Min, IsInt, Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LineItemDto } from '../../quotes/dto/create-quote.dto';

export class CreateInvoiceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() quoteId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jobId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() componentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() workOrderId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() templateId?: string;
  @ApiProperty() @IsString() customerId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerEmail?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) dueDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) taxRate?: number;
  @ApiPropertyOptional({ example: 'USD', description: 'ISO 4217 code; ignored when creating from a quote (inherits the quote\'s currency), defaults to the tenant currency otherwise' })
  @IsOptional() @IsString() @Length(3, 3) currency?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() terms?: string;

  @ApiPropertyOptional({ type: [LineItemDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LineItemDto)
  lineItems?: LineItemDto[];
}
