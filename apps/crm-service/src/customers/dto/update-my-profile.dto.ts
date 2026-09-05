import { IsOptional, IsString, MaxLength, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * What a signed-in customer may change about their own record.
 *
 * A real DTO class on purpose: the endpoint used to take an inline-typed object
 * and hand it straight to `prisma.customer.update`. TypeScript shaped it at
 * compile time, but nothing stripped extra keys at runtime, so a crafted PATCH
 * could have written fields the customer has no business touching (isActive,
 * engagementStatus, tags…). A validated class means the global whitelist pipe
 * drops anything not listed here.
 */
export class UpdateMyProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) mobile?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) zipCode?: string;

  // Service location — the default pin for jobs booked for this customer.
  @ApiPropertyOptional({ example: 6.9271 })
  @IsOptional() @IsNumber() @Min(-90) @Max(90) latitude?: number;

  @ApiPropertyOptional({ example: 79.8612 })
  @IsOptional() @IsNumber() @Min(-180) @Max(180) longitude?: number;

  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional() @IsString() @MaxLength(60) locationTag?: string;
}
