import {
  IsString,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendSmsDto {
  @ApiProperty() @IsString() recipientId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() recipientName?: string;
  @ApiProperty() @IsString() recipientPhone!: string;
  @ApiProperty() @IsString() body!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jobId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() invoiceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
}

export class SendEmailDto {
  @ApiProperty() @IsString() recipientId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() recipientName?: string;
  @ApiProperty() @IsEmail() recipientEmail!: string;
  @ApiProperty() @IsString() subject!: string;
  @ApiProperty() @IsString() htmlBody!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jobId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() invoiceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() quoteId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
}

export class SendPushDto {
  @ApiProperty() @IsString() recipientId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() recipientName?: string;
  @ApiProperty() @IsString() pushToken!: string;
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() body!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jobId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
}

export enum NotificationChannelFilter {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum NotificationStatusFilter {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}
