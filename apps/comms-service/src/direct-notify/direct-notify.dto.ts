import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export type DirectChannel = 'email' | 'push';

export class DirectNotifyDto {
  @ApiProperty({ enum: ['customer', 'staff'] }) @IsIn(['customer', 'staff']) to!: 'customer' | 'staff';
  @ApiProperty({ description: 'Customer id, or the staff member\'s user id.' }) @IsString() id!: string;
  @ApiProperty() @IsString() @MaxLength(120) title!: string;
  @ApiProperty() @IsString() @MaxLength(2000) message!: string;
  @ApiProperty({ enum: ['email', 'push'], isArray: true })
  @IsArray() @ArrayNotEmpty() @IsIn(['email', 'push'], { each: true }) channels!: DirectChannel[];
  @ApiPropertyOptional() @IsOptional() @IsString() jobId?: string;
}
