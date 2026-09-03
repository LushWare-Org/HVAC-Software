import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendDocumentDto {
  @ApiProperty({ description: 'From /v1/callers/lookup or /v1/callers/match' })
  @IsString()
  customerId!: string;

  @ApiProperty({ enum: ['invoice', 'quote'] })
  @IsEnum(['invoice', 'quote'])
  documentType!: 'invoice' | 'quote';

  @ApiProperty()
  @IsString()
  documentId!: string;

  @ApiProperty({ enum: ['sms', 'email'] })
  @IsEnum(['sms', 'email'])
  channel!: 'sms' | 'email';
}

export class SendConfirmationDto {
  @ApiProperty({ enum: ['sms', 'email'] })
  @IsEnum(['sms', 'email'])
  channel!: 'sms' | 'email';
}
