import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TemplateTypeEnum {
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  JOB_STATUS_UPDATE = 'JOB_STATUS_UPDATE',
  INVOICE_SENT = 'INVOICE_SENT',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  REVIEW_REQUEST = 'REVIEW_REQUEST',
  WELCOME = 'WELCOME',
  CUSTOM = 'CUSTOM',
}

export enum ChannelEnum {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export class CreateTemplateDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ enum: TemplateTypeEnum }) @IsEnum(TemplateTypeEnum) type!: TemplateTypeEnum;
  @ApiProperty({ enum: ChannelEnum }) @IsEnum(ChannelEnum) channel!: ChannelEnum;

  @ApiPropertyOptional({ description: 'Email subject (EMAIL channel only). Supports Handlebars.' })
  @IsOptional() @IsString() subject?: string;

  @ApiProperty({ description: 'Message body with Handlebars variables e.g. {{customerName}}' })
  @IsString() body!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true }) variables?: string[];

  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subject?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() body?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) variables?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class RenderTemplateDto {
  @ApiProperty({ description: 'Key-value pairs to fill the template variables' })
  @IsObject()
  context!: Record<string, unknown>;
}
