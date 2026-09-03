import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ALL_PARTNER_SCOPES } from '../scopes';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Acme Voice AI — production' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    isArray: true,
    example: ['customer:lookup', 'availability:read', 'booking:create'],
    description: `One or more of: ${ALL_PARTNER_SCOPES.join(', ')} (or a resource wildcard such as "invoice:*")`,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  scopes!: string[];

  @ApiPropertyOptional({ enum: ['LIVE', 'SANDBOX'], default: 'LIVE' })
  @IsOptional()
  @IsEnum(['LIVE', 'SANDBOX'])
  environment?: 'LIVE' | 'SANDBOX';

  @ApiPropertyOptional({ minimum: 1, maximum: 6000, default: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6000)
  rateLimitPerMin?: number;

  @ApiPropertyOptional({ description: 'ISO date; key stops working after this' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
