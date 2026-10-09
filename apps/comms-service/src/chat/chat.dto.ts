import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUrl, MaxLength, Min, ValidateNested,
} from 'class-validator';

export class AttachmentDto {
  @IsUrl({ protocols: ['https'], require_protocol: true }) url!: string;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(100) type?: string;
  @IsOptional() @IsInt() @Min(0) size?: number;
}

export class SendChatMessageDto {
  @IsString() @MaxLength(4000) body!: string;
  @ApiPropertyOptional({ description: "The sender's own id for this message; a retry with the same id is not posted twice." })
  @IsOptional() @IsString() @MaxLength(64) clientId?: string;
  @IsOptional() @IsString() jobId?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => AttachmentDto) attachments?: AttachmentDto[];
  @ApiPropertyOptional({ enum: ['kelvin'] }) @IsOptional() @IsIn(['kelvin']) via?: 'kelvin';
  @ApiPropertyOptional({ description: 'Staff to customer: also email it.' }) @IsOptional() @IsBoolean() alsoEmail?: boolean;
}

export class OpenOfficeDto { @IsOptional() @IsString() customerId?: string }
export class OpenCustomerTechDto { @IsOptional() @IsString() techUserId?: string; @IsOptional() @IsString() customerId?: string }
export class OpenTechOfficeDto { @IsOptional() @IsString() techUserId?: string }
export class OpenDirectDto { @IsString() userId!: string }
export class CreateGroupDto {
  @IsString() @MaxLength(80) title!: string;
  @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) userIds!: string[];
}
export class EditMessageDto { @IsString() @MaxLength(4000) body!: string }
export class ReadDto { @IsOptional() @IsInt() @Min(0) seq?: number }
export class MuteDto { @IsOptional() @IsString() until?: string | null }
export class ArchiveDto { @IsBoolean() archived!: boolean }
