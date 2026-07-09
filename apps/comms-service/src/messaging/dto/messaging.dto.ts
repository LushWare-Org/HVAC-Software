import { IsString, IsOptional, IsArray, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateThreadDto {
  // Customer thread fields (optional for staff-to-staff threads)
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() customerEmail?: string;
  // Staff/internal thread fields
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) participantIds?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) participantNames?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() subject?: string;
  // Job context
  @ApiPropertyOptional() @IsOptional() @IsString() jobId?: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Message body' }) @IsString() body!: string;
  @ApiPropertyOptional({ description: 'Media attachment URLs' })
  @IsOptional() mediaUrls?: string[];
  @ApiPropertyOptional({ description: 'Also email the message to the thread customer' })
  @IsOptional() @IsBoolean() notifyEmail?: boolean;
  @ApiPropertyOptional({ description: 'Subject for the notification email (falls back to thread subject)' })
  @IsOptional() @IsString() emailSubject?: string;
}

export class UpdateThreadStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'RESOLVED', 'SPAM'] })
  @IsString() status!: 'ACTIVE' | 'RESOLVED' | 'SPAM';
}

/** Twilio inbound webhook payload (subset of fields we use) */
export interface TwilioInboundWebhookDto {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  MediaUrl0?: string;
  MediaUrl1?: string;
  NumMedia?: string;
}
