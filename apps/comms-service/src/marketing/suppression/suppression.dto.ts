import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MarketingChannel, SuppressionReason } from '../prisma/generated';

export class AddSuppressionDto {
  @ApiProperty({ enum: MarketingChannel })
  @IsEnum(MarketingChannel)
  channel!: MarketingChannel;

  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ enum: SuppressionReason })
  @IsEnum(SuppressionReason)
  reason!: SuppressionReason;
}

export class RemoveSuppressionDto {
  @ApiProperty({ enum: MarketingChannel })
  @IsEnum(MarketingChannel)
  channel!: MarketingChannel;

  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  @IsNotEmpty()
  address!: string;
}
