import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiPropertyOptional({
    description:
      'Existing customer, from /v1/callers/lookup or /v1/callers/match. Omit for a ' +
      'first-time caller and a customer record will be created from the fields below.',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ example: 'AC repair' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  serviceType!: string;

  @ApiProperty({ description: 'ISO instant, from a slot returned by /v1/availability' })
  @IsDateString()
  preferredDate!: string;

  @ApiPropertyOptional({ example: 'Blowing warm air since Tuesday' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  // --- Required for a first-time caller (ignored when customerId is given) ---

  @ApiPropertyOptional({ example: 'Sarah' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Jones' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: '+94771234567' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '12 Baker Street' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;
}
