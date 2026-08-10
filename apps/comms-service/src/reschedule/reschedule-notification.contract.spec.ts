/**
 * Contract test for the job-service → comms-service hop.
 *
 * job-service calls POST /notifications/reschedule fire-and-forget, so a DTO
 * mismatch produces a 400 that nobody ever sees: the reschedule succeeds, no
 * notification is sent, and no error surfaces to the user. That is exactly the
 * failure mode this guards.
 *
 * The payloads below are copied from what RescheduleNotifyClient actually
 * sends (`{ event, job, request }`, with `request` being a Prisma
 * RescheduleRequest including its `slots`). If either side's shape drifts, this
 * fails instead of going quiet in production.
 */
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RescheduleNotificationDto, RESCHEDULE_EVENTS } from './dto/reschedule-notification.dto';

/** Shape job-service serialises — Dates become ISO strings over JSON. */
function jobServicePayload(event: string, overrides: Record<string, any> = {}): Record<string, any> {
  return {
    event,
    job: {
      id: 'job-1',
      companyId: 'co-1',
      jobNumber: 'JOB-2026-0001',
      customerId: 'cust-1',
      customerName: 'Alice',
      customerEmail: 'alice@example.com',
      title: 'AC Maintenance',
      status: 'SCHEDULED',
      scheduledStart: '2026-08-10T14:00:00.000Z',
      assignedToId: 'tech-1',
      assignedToName: 'Miguel',
      rescheduleState: 'AWAITING_CUSTOMER',
    },
    request: {
      id: 'req-1',
      companyId: 'co-1',
      jobId: 'job-1',
      openedBy: 'ADMIN',
      openedByUserId: 'u-1',
      openedByName: 'Admin',
      mode: 'PROPOSE_SLOTS',
      reasonCode: 'PARTS_DELAY',
      reason: 'Compressor on back-order',
      status: 'AWAITING_RESPONSE',
      pickedSlotId: null,
      responseNote: null,
      respondedAt: null,
      respondedByName: null,
      appliedAt: null,
      nudgedAt: null,
      createdAt: '2026-08-06T00:00:00.000Z',
      updatedAt: '2026-08-06T00:00:00.000Z',
      slots: [
        { id: 's1', requestId: 'req-1', startAt: '2026-08-20T13:00:00.000Z', endAt: '2026-08-20T17:00:00.000Z', window: 'morning' },
      ],
    },
    ...overrides,
  };
}

function validate(payload: unknown) {
  return validateSync(plainToInstance(RescheduleNotificationDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: false,
  });
}

describe('POST /notifications/reschedule — job-service payload contract', () => {
  it.each(RESCHEDULE_EVENTS)('accepts a real %s payload', (event) => {
    expect(validate(jobServicePayload(event))).toHaveLength(0);
  });

  it('accepts an OPEN_ASK round carrying no slots', () => {
    const p = jobServicePayload('OPENED');
    p.request.mode = 'OPEN_ASK';
    p.request.slots = [];
    expect(validate(p)).toHaveLength(0);
  });

  it('accepts an applied round with pickedSlotId set', () => {
    const p = jobServicePayload('APPLIED');
    p.request.pickedSlotId = 's1';
    p.request.status = 'APPLIED';
    p.request.appliedAt = '2026-08-06T01:00:00.000Z';
    expect(validate(p)).toHaveLength(0);
  });

  it('accepts a job with no customer email (in-app only path)', () => {
    const p = jobServicePayload('OPENED');
    (p.job as any).customerEmail = null;
    expect(validate(p)).toHaveLength(0);
  });

  it('rejects an unknown event name', () => {
    const errs = validate(jobServicePayload('NONSENSE'));
    expect(errs.length).toBeGreaterThan(0);
    expect(errs[0].property).toBe('event');
  });

  it('rejects a missing job or request', () => {
    expect(validate({ event: 'OPENED', request: {} }).length).toBeGreaterThan(0);
    expect(validate({ event: 'OPENED', job: {} }).length).toBeGreaterThan(0);
  });

  it('every event the notify client can send is a declared event', () => {
    // Mirrors RescheduleEvent in job-service's reschedule-notify.client.ts.
    const clientEvents = ['OPENED', 'RESPONDED', 'APPLIED', 'CLOSED', 'NUDGE'];
    expect([...RESCHEDULE_EVENTS].sort()).toEqual(clientEvents.sort());
  });
});
