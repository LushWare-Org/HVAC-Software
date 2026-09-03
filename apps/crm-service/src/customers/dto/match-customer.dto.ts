import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MatchCustomerDto {
  @ApiProperty({ example: 'Sarah' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Jones' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ example: '12 Baker Street' })
  @IsString()
  @MinLength(4)
  @MaxLength(200)
  address!: string;

  @ApiPropertyOptional({ example: '00300', description: 'Narrows the match when supplied' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;
}
