import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CustomerPushDto {
  @ApiProperty() @IsString() companyId!: string;
  @ApiProperty() @IsString() customerId!: string;
  @ApiProperty() @IsString() @MaxLength(120) title!: string;
  @ApiProperty() @IsString() @MaxLength(400) body!: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() data?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() @IsString() jobId?: string;
  @ApiPropertyOptional({ description: 'Idempotency key; a second send with the same key is skipped.' })
  @IsOptional() @IsString() dedupeKey?: string;
}
