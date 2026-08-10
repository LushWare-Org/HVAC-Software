/**
 * RescheduleApplyService — the calendar write.
 *
 * The cases that matter most here are the refusals: applying twice, applying a
 * slot that has gone stale, and applying to a job that finished or whose
 * technician already left. Each one, uncaught, corrupts a real appointment.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Role, RescheduleActor, RescheduleStatus } from '@tscrm/types';
import { RescheduleApplyService } from './reschedule-apply.service';
import { RescheduleService } from './reschedule.service';
import { SchedulingClient } from './scheduling.client';
import { RescheduleNotifyClient } from './reschedule-notify.client';
import { PrismaService } from '../prisma/prisma.service';
import { JobEventsPublisher } from '../realtime/job-events.publisher';

const COMPANY_ID = 'co-001';
const JOB_ID = 'job-001';
const REQ_ID = 'req-001';

function makeAuthUser(role: Role = Role.COMPANY_ADMIN, customerId?: string) {
  return {
    sub: 'u1', userId: 'u1', companyId: COMPANY_ID,
    email: 'staff@test.com', name: 'Staff', role, customerId,
  } as any;
}

const slotStart = new Date(Date.now() + 3 * 86_400_000);
const slotEnd = new Date(slotStart.getTime() + 4 * 3_600_000);

const baseJob = {
  id: JOB_ID, companyId: COMPANY_ID, status: 'SCHEDULED', customerId: 'cust-1',
  customerName: 'Alice', customerEmail: 'alice@test.com', title: 'AC',
  jobNumber: 'JOB-1', assignedToId: 'tech-1', assignedToName: 'Miguel',
  scheduledStart: new Date(),
};

function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: REQ_ID, companyId: COMPANY_ID, jobId: JOB_ID,
    status: RescheduleStatus.SLOT_PICKED, pickedSlotId: 'slot-1',
    openedBy: RescheduleActor.ADMIN,
    slots: [{ id: 'slot-1', startAt: slotStart, endAt: slotEnd, window: 'morning' }],
    job: baseJob,
    ...overrides,
  };
}

const mockEvents = { publish: jest.fn() };

const mockPrisma: any = {
  rescheduleRequest: { findFirst: jest.fn(), updateMany: jest.fn() },
  job: { update: jest.fn() },
  jobStatusHistory: { create: jest.fn() },
  $transaction: jest.fn(),
};
const mockScheduling = { cancelAssignmentForJob: jest.fn() };
const mockNotify = { applied: jest.fn() };
const mockCore = { findRequest: jest.fn() };

describe('RescheduleApplyService', () => {
  let service: RescheduleApplyService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());
    mockPrisma.rescheduleRequest.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.job.update.mockResolvedValue({});
    mockPrisma.jobStatusHistory.create.mockResolvedValue({});
    mockPrisma.$transaction.mockImplementation((fn: any) =>
      typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn));
    mockScheduling.cancelAssignmentForJob.mockResolvedValue(true);
    mockNotify.applied.mockResolvedValue(undefined);
    mockCore.findRequest.mockResolvedValue(makeRequest({ status: RescheduleStatus.APPLIED }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RescheduleApplyService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JobEventsPublisher, useValue: mockEvents },
        { provide: RescheduleService, useValue: mockCore },
        { provide: SchedulingClient, useValue: mockScheduling },
        { provide: RescheduleNotifyClient, useValue: mockNotify },
      ],
    }).compile();
    service = module.get(RescheduleApplyService);
  });

  it('writes the slot to the calendar, unassigns the tech, and re-queues the job', async () => {
    await service.apply(makeAuthUser(Role.COMPANY_ADMIN), REQ_ID, {});

    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: JOB_ID },
      data: expect.objectContaining({
        scheduledStart: slotStart,
        scheduledEnd: slotEnd,
        assignedToId: null,
        assignedToName: null,
        status: 'PENDING',
        rescheduleState: null,
      }),
    }));
  });

  it('cancels the dispatch assignment', async () => {
    await service.apply(makeAuthUser(), REQ_ID, {});
    expect(mockScheduling.cancelAssignmentForJob).toHaveBeenCalledWith(COMPANY_ID, JOB_ID);
  });

  it('records the move in job status history', async () => {
    await service.apply(makeAuthUser(), REQ_ID, {});
    const note = mockPrisma.jobStatusHistory.create.mock.calls[0][0].data;
    expect(note.jobId).toBe(JOB_ID);
    expect(note.toStatus).toBe('PENDING');
    expect(note.note).toContain('Rescheduled');
  });

  it('marks the request APPLIED and notifies the customer', async () => {
    await service.apply(makeAuthUser(), REQ_ID, {});
    expect(mockPrisma.rescheduleRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: REQ_ID, status: RescheduleStatus.SLOT_PICKED },
      data: expect.objectContaining({ status: RescheduleStatus.APPLIED }),
    }));
    expect(mockNotify.applied).toHaveBeenCalled();
  });

  it('409s when another staff member applied first, without touching the calendar', async () => {
    mockPrisma.rescheduleRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.apply(makeAuthUser(), REQ_ID, {})).rejects.toThrow(ConflictException);
    expect(mockPrisma.job.update).not.toHaveBeenCalled();
    expect(mockNotify.applied).not.toHaveBeenCalled();
  });

  it.each([Role.CUSTOMER, Role.TECHNICIAN])('refuses a %s caller', async (role) => {
    await expect(
      service.apply(makeAuthUser(role, 'cust-1'), REQ_ID, {}),
    ).rejects.toThrow(ForbiddenException);
    expect(mockPrisma.job.update).not.toHaveBeenCalled();
  });

  it('refuses when no slot has been picked yet', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(
      makeRequest({ status: RescheduleStatus.AWAITING_RESPONSE, pickedSlotId: null }));
    await expect(service.apply(makeAuthUser(), REQ_ID, {})).rejects.toThrow(BadRequestException);
  });

  it('refuses when the picked slot has since passed', async () => {
    const past = new Date(Date.now() - 86_400_000);
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest({
      slots: [{ id: 'slot-1', startAt: past, endAt: new Date(past.getTime() + 3_600_000), window: null }],
    }));
    await expect(service.apply(makeAuthUser(), REQ_ID, {})).rejects.toThrow(BadRequestException);
    expect(mockPrisma.job.update).not.toHaveBeenCalled();
  });

  it.each(['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'])(
    'refuses to resurrect a %s job and closes the request', async (status) => {
      mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(
        makeRequest({ job: { ...baseJob, status } }));

      await expect(service.apply(makeAuthUser(), REQ_ID, {})).rejects.toThrow(BadRequestException);

      // Auto-closed so it stops sitting in the inbox, but the calendar is untouched.
      expect(mockPrisma.rescheduleRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: RescheduleStatus.CANCELLED }),
      }));
      const calendarWrites = mockPrisma.job.update.mock.calls.filter(
        (c: any[]) => c[0].data.scheduledStart !== undefined);
      expect(calendarWrites).toHaveLength(0);
    });

  it('refuses an EN_ROUTE job unless confirmEnRoute is passed', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(
      makeRequest({ job: { ...baseJob, status: 'EN_ROUTE' } }));

    await expect(service.apply(makeAuthUser(), REQ_ID, {})).rejects.toThrow(ConflictException);
    expect(mockPrisma.job.update).not.toHaveBeenCalled();

    await expect(
      service.apply(makeAuthUser(), REQ_ID, { confirmEnRoute: true }),
    ).resolves.toBeDefined();
    expect(mockPrisma.job.update).toHaveBeenCalled();
  });

  it('still applies when scheduling-service cannot be reached', async () => {
    mockScheduling.cancelAssignmentForJob.mockResolvedValue(false);
    await expect(service.apply(makeAuthUser(), REQ_ID, {})).resolves.toBeDefined();
    expect(mockPrisma.job.update).toHaveBeenCalled();
  });

  it('still applies when the notification fails', async () => {
    mockNotify.applied.mockRejectedValue(new Error('comms down'));
    await expect(service.apply(makeAuthUser(), REQ_ID, {})).resolves.toBeDefined();
  });
});
