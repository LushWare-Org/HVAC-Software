import { IsIn, IsNotEmpty, IsObject } from 'class-validator';

export const RESCHEDULE_EVENTS = ['OPENED', 'RESPONDED', 'APPLIED', 'CLOSED', 'NUDGE'] as const;
export type RescheduleEventName = (typeof RESCHEDULE_EVENTS)[number];

export class RescheduleNotificationDto {
  @IsIn(RESCHEDULE_EVENTS as unknown as string[])
  event!: RescheduleEventName;

  // Loose shapes on purpose: job-service owns these records, and pinning every
  // field here would mean a DTO change every time that schema grows. The
  // service reads only the handful of fields it needs and tolerates gaps.
  @IsObject() @IsNotEmpty() job!: Record<string, any>;
  @IsObject() @IsNotEmpty() request!: Record<string, any>;
}
