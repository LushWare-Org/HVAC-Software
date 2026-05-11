import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const PUSH_PLATFORMS = ['ios', 'android', 'web', 'expo'] as const;
export type PushPlatform = (typeof PUSH_PLATFORMS)[number];

export class RegisterPushTokenDto {
  @ApiProperty({ description: 'FCM/APNs/Expo push token for the current user.' })
  @IsString()
  @MaxLength(2048)
  token!: string;

  @ApiPropertyOptional({ enum: PUSH_PLATFORMS })
  @IsOptional()
  @IsIn(PUSH_PLATFORMS as readonly string[])
  platform?: PushPlatform;
}
