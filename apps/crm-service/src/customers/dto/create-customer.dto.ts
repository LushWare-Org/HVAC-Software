import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CustomerType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
}

export enum CustomerEngagementStatusDto {
  ACTIVE = 'ACTIVE',
  QUOTE_SENT = 'QUOTE_SENT',
  INVOICE_SENT = 'INVOICE_SENT',
  JOB_BOOKED = 'JOB_BOOKED',
  COMPLETED = 'COMPLETED',
  INACTIVE = 'INACTIVE',
}

export class CreateCustomerDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ enum: CustomerType, default: CustomerType.RESIDENTIAL })
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '555-0101' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: '456 Oak Ave' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Austin' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'TX' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '78702' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'google' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ type: [String], example: ['vip', 'repeat'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: CustomerEngagementStatusDto, default: CustomerEngagementStatusDto.ACTIVE })
  @IsOptional()
  @IsEnum(CustomerEngagementStatusDto)
  engagementStatus?: CustomerEngagementStatusDto;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
