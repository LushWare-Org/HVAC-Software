import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsISO8601,
  IsOptional, IsString, MaxLength, ValidateIf, ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RescheduleMode, RescheduleReason } from '@tscrm/types';

export class SlotInputDto {
  @ApiProperty() @IsISO8601() startAt!: string;
  @ApiProperty() @IsISO8601() endAt!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() window?: string;
}

export class OpenRescheduleDto {
  @ApiProperty({ enum: RescheduleMode }) @IsEnum(RescheduleMode) mode!: RescheduleMode;

  @ApiProperty({ enum: RescheduleReason }) @IsEnum(RescheduleReason) reasonCode!: RescheduleReason;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) reason?: string;

  // Nested DTOs need both @ValidateNested and @Type, or `whitelist: true`
  // strips them silently and the request arrives with no slots at all.
  @ApiPropertyOptional({ type: [SlotInputDto] })
  @ValidateIf((o: OpenRescheduleDto) => o.mode === RescheduleMode.PROPOSE_SLOTS)
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(3)
  @ValidateNested({ each: true }) @Type(() => SlotInputDto)
  slots?: SlotInputDto[];
}

export enum RescheduleResponseAction {
  PICK = 'PICK',
  COUNTER = 'COUNTER',
  DECLINE = 'DECLINE',
}

export class RespondRescheduleDto {
  @ApiProperty({ enum: RescheduleResponseAction })
  @IsEnum(RescheduleResponseAction) action!: RescheduleResponseAction;

  @ApiPropertyOptional()
  @ValidateIf((o: RespondRescheduleDto) => o.action === RescheduleResponseAction.PICK)
  @IsString() pickedSlotId?: string;

  @ApiPropertyOptional({ enum: RescheduleReason })
  @ValidateIf((o: RespondRescheduleDto) => o.action === RescheduleResponseAction.COUNTER)
  @IsEnum(RescheduleReason) reasonCode?: RescheduleReason;

  @ApiPropertyOptional({ type: [SlotInputDto] })
  @ValidateIf((o: RespondRescheduleDto) => o.action === RescheduleResponseAction.COUNTER)
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(3)
  @ValidateNested({ each: true }) @Type(() => SlotInputDto)
  slots?: SlotInputDto[];

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) note?: string;
}

export class ApplyRescheduleDto {
  // Guards against a one-click Apply cancelling a technician who is already
  // driving. The inbox button never sends this; only the explicit warning
  // dialog does. See RescheduleApplyService.
  @ApiPropertyOptional({ description: 'Required to apply when the job is EN_ROUTE.' })
  @IsOptional() @IsBoolean() confirmEnRoute?: boolean;
}
