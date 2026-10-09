import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AutomationTriggerEnum {
  JOB_STATUS_CHANGED = 'JOB_STATUS_CHANGED',
  INVOICE_SENT = 'INVOICE_SENT',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  QUOTE_APPROVED = 'QUOTE_APPROVED',
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  MANUAL = 'MANUAL',
}

export class CreateAutomationRuleDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ enum: AutomationTriggerEnum })
  @IsEnum(AutomationTriggerEnum) trigger!: AutomationTriggerEnum;

  @ApiProperty({
    description: 'JSON conditions e.g. {"jobStatus": "COMPLETED"}',
    example: '{"jobStatus":"COMPLETED"}',
  })
  @IsString() conditions!: string;

  @ApiProperty({
    description: 'JSON array of channel actions e.g. [{"channel":"SMS","templateId":"..."}]',
    example: '[{"channel":"SMS","templateId":"abc123"}]',
  })
  @IsString() actions!: string;

  @ApiPropertyOptional({ description: 'Delay in minutes before sending. 0 = immediate.' })
  @IsOptional() @IsNumber() @Min(0) delayMinutes?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateAutomationRuleDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() conditions?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() actions?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) delayMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

// ── Event payloads (published by other services via internal HTTP or BullMQ) ─

export interface JobStatusChangedEvent {
  companyId: string;
  jobId: string;
  jobStatus: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  jobAddress?: string;
  technicianName?: string;
  scheduledAt?: string;
  jobTitle?: string;
  jobNumber?: string;
  cancellationReason?: string;
  statusNote?: string;
}

/** A booked visit got a technician and a time, or one of them changed. */
export interface JobScheduleChangedEvent {
  companyId: string;
  jobId: string;
  change: 'SCHEDULED' | 'TIME_CHANGED' | 'TECH_CHANGED' | 'TIME_AND_TECH_CHANGED';
  customerId: string;
  customerName: string;
  customerEmail?: string;
  jobTitle?: string;
  jobNumber?: string;
  jobAddress?: string;
  technicianName?: string;
  scheduledAt?: string;
  scheduledEnd?: string;
  /** Set when the customer booked an arrival window and no exact time is fixed. */
  windowStart?: string;
  windowEnd?: string;
  previousScheduledAt?: string;
  /** Users (not technician records): who has the job now, and who had it before. */
  technicianUserId?: string;
  previousTechnicianUserId?: string;
}

export interface InvoiceSentEvent {
  companyId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  total: string;
  dueDate?: string;
  paymentUrl?: string;
}

export interface PaymentReceivedEvent {
  companyId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  amountPaid: string;
}

export interface QuoteApprovedEvent {
  companyId: string;
  quoteId: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  approvedByName?: string;
}

export interface AppointmentBookedEvent {
  companyId: string;
  jobId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  scheduledAt: string;
  jobAddress?: string;
  technicianName?: string;
}

export type AutomationEventPayload =
  | JobStatusChangedEvent
  | InvoiceSentEvent
  | PaymentReceivedEvent
  | QuoteApprovedEvent
  | AppointmentBookedEvent;
