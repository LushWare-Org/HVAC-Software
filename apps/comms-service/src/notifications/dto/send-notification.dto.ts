import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsBase64,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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

export class EmailAttachmentDto {
  @ApiProperty() @IsString() filename!: string;
  @ApiProperty() @IsString() contentType!: string;
  @ApiProperty() @IsBase64() contentBase64!: string;
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
  @ApiPropertyOptional({ type: [EmailAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];
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

export class InAppRecipientDto {
  @ApiProperty() @IsString() recipientId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() recipientName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() role?: string;
}

export class SendInAppNotificationDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() body!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) roles?: string[];
  @ApiProperty({ type: [InAppRecipientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InAppRecipientDto)
  recipients!: InAppRecipientDto[];
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
