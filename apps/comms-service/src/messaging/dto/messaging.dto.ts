import { IsString, IsOptional, IsPhoneNumber, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateThreadDto {
  @ApiProperty() @IsString() customerId!: string;
  @ApiProperty() @IsString() customerName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() customerEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jobId?: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Message body' }) @IsString() body!: string;
  @ApiPropertyOptional({ description: 'Media attachment URLs' })
  @IsOptional() mediaUrls?: string[];
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
