/**
 * RescheduleService — negotiation unit tests.
 *
 * Prisma is fully mocked; no database required. The rules under test are the
 * ones a bug would let a customer past: whose job it is, whose move it is, and
 * whether a proposed time is still valid.
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException, ConflictException, ForbiddenException, NotFoundException,
} from '@nestjs/common';
import {
  Role, RescheduleActor, RescheduleMode, RescheduleReason, RescheduleState, RescheduleStatus,
} from '@tscrm/types';
import { RescheduleService } from './reschedule.service';
import { RescheduleNotifyClient } from './reschedule-notify.client';
import { PrismaService } from '../prisma/prisma.service';
import { JobEventsPublisher } from '../realtime/job-events.publisher';
import { RescheduleResponseAction } from './dto/reschedule.dto';

const COMPANY_ID = 'co-001';
const JOB_ID = 'job-001';

function makeAuthUser(role: Role = Role.COMPANY_ADMIN, customerId?: string) {
  return {
    sub: 'user-001', userId: 'user-001', companyId: COMPANY_ID,
    email: 'staff@test.com', name: 'Test Staff', role, customerId,
  } as any;
}

function makeJob(overrides: Record<string, unknown> = {}) {
  return {
    id: JOB_ID, companyId: COMPANY_ID, status: 'SCHEDULED',
    customerId: 'cust-001', customerName: 'Alice', customerEmail: 'alice@test.com',
    title: 'AC Maintenance', jobNumber: 'JOB-2026-0001',
    scheduledStart: new Date('2026-08-10T14:00:00Z'),
    scheduledEnd: new Date('2026-08-10T18:00:00Z'),
    assignedToId: 'tech-1', assignedToName: 'Miguel',
    estimatedDurationMins: 120, rescheduleState: null,
    ...overrides,
  };
}

const mockEvents = { publish: jest.fn() };

const mockPrisma: any = {
  job: { findFirst: jest.fn(), update: jest.fn() },
  rescheduleRequest: {
    create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    update: jest.fn(), updateMany: jest.fn(), count: jest.fn(), groupBy: jest.fn(),
  },
  rescheduleSlot: { createMany: jest.fn(), findFirst: jest.fn() },
  $transaction: jest.fn(),
};

const mockNotify = {
  requestOpened: jest.fn().mockResolvedValue(undefined),
  responded: jest.fn().mockResolvedValue(undefined),
  applied: jest.fn().mockResolvedValue(undefined),
  closed: jest.fn().mockResolvedValue(undefined),
  nudge: jest.fn().mockResolvedValue(undefined),
};

const futureSlot = () => {
  const start = new Date(Date.now() + 3 * 86_400_000);
  const end = new Date(start.getTime() + 4 * 3_600_000);
  return { startAt: start.toISOString(), endAt: end.toISOString(), window: 'morning' };
};

async function buildService(): Promise<RescheduleService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      RescheduleService,
      { provide: PrismaService, useValue: mockPrisma },
        { provide: JobEventsPublisher, useValue: mockEvents },
      { provide: RescheduleNotifyClient, useValue: mockNotify },
    ],
  }).compile();
  return module.get(RescheduleService);
}

describe('RescheduleService.open', () => {
  let service: RescheduleService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.job.findFirst.mockResolvedValue(makeJob());
    mockPrisma.job.update.mockResolvedValue({});
    mockPrisma.rescheduleRequest.create.mockImplementation(({ data }: any) => ({ id: 'req-1', ...data }));
    mockPrisma.$transaction.mockImplementation((fn: any) =>
      typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn));
    service = await buildService();
  });

  it('staff opening a slot proposal puts the ball with the customer', async () => {
    await service.open(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID, {
      mode: RescheduleMode.PROPOSE_SLOTS,
      reasonCode: RescheduleReason.PARTS_DELAY,
      slots: [futureSlot()],
    });

    const created = mockPrisma.rescheduleRequest.create.mock.calls[0][0].data;
    expect(created.openedBy).toBe(RescheduleActor.ADMIN);
    expect(created.companyId).toBe(COMPANY_ID);
    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: JOB_ID },
      data: { rescheduleState: RescheduleState.AWAITING_CUSTOMER },
    }));
  });

  it('a customer opening a request puts the ball with staff', async () => {
    await service.open(makeAuthUser(Role.CUSTOMER, 'cust-001'), JOB_ID, {
      mode: RescheduleMode.OPEN_ASK,
      reasonCode: RescheduleReason.CUSTOMER_UNAVAILABLE,
    });

    const created = mockPrisma.rescheduleRequest.create.mock.calls[0][0].data;
    expect(created.openedBy).toBe(RescheduleActor.CUSTOMER);
    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { rescheduleState: RescheduleState.AWAITING_ADMIN },
    }));
  });

  it("rejects a customer opening a request on someone else's job", async () => {
    await expect(
      service.open(makeAuthUser(Role.CUSTOMER, 'cust-999'), JOB_ID, {
        mode: RescheduleMode.OPEN_ASK, reasonCode: RescheduleReason.CUSTOMER_UNAVAILABLE,
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(mockPrisma.rescheduleRequest.create).not.toHaveBeenCalled();
  });

  it('rejects a customer on an EN_ROUTE job but allows staff', async () => {
    mockPrisma.job.findFirst.mockResolvedValue(makeJob({ status: 'EN_ROUTE' }));

    await expect(
      service.open(makeAuthUser(Role.CUSTOMER, 'cust-001'), JOB_ID, {
        mode: RescheduleMode.OPEN_ASK, reasonCode: RescheduleReason.CUSTOMER_UNAVAILABLE,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.open(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID, {
        mode: RescheduleMode.OPEN_ASK, reasonCode: RescheduleReason.TECH_UNAVAILABLE,
      }),
    ).resolves.toBeDefined();
  });

  it.each(['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED', 'ON_SITE'])(
    'refuses to open on a %s job for either side', async (status) => {
      mockPrisma.job.findFirst.mockResolvedValue(makeJob({ status }));
      await expect(
        service.open(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID, {
          mode: RescheduleMode.OPEN_ASK, reasonCode: RescheduleReason.OTHER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

  it('refuses a second open request on the same job', async () => {
    mockPrisma.job.findFirst.mockResolvedValue(
      makeJob({ rescheduleState: RescheduleState.AWAITING_CUSTOMER }));
    await expect(
      service.open(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID, {
        mode: RescheduleMode.OPEN_ASK, reasonCode: RescheduleReason.OTHER,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a proposed slot that is already in the past', async () => {
    const past = new Date(Date.now() - 86_400_000);
    await expect(
      service.open(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID, {
        mode: RescheduleMode.PROPOSE_SLOTS, reasonCode: RescheduleReason.PARTS_DELAY,
        slots: [{ startAt: past.toISOString(), endAt: new Date(past.getTime() + 3_600_000).toISOString() }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a slot whose end is not after its start', async () => {
    const start = new Date(Date.now() + 86_400_000);
    await expect(
      service.open(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID, {
        mode: RescheduleMode.PROPOSE_SLOTS, reasonCode: RescheduleReason.PARTS_DELAY,
        slots: [{ startAt: start.toISOString(), endAt: start.toISOString() }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFound for a job in another company', async () => {
    mockPrisma.job.findFirst.mockResolvedValue(null);
    await expect(
      service.open(makeAuthUser(), 'nope', {
        mode: RescheduleMode.OPEN_ASK, reasonCode: RescheduleReason.OTHER,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('notifies the other side without awaiting it', async () => {
    await service.open(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID, {
      mode: RescheduleMode.PROPOSE_SLOTS, reasonCode: RescheduleReason.WEATHER, slots: [futureSlot()],
    });
    expect(mockNotify.requestOpened).toHaveBeenCalled();
  });
});

describe('RescheduleService.respond', () => {
  let service: RescheduleService;

  const makeRequest = (overrides: Record<string, unknown> = {}) => ({
    id: 'req-1', companyId: COMPANY_ID, jobId: JOB_ID,
    openedBy: RescheduleActor.ADMIN,
    mode: RescheduleMode.PROPOSE_SLOTS,
    status: RescheduleStatus.AWAITING_RESPONSE,
    slots: [{
      id: 'slot-1',
      startAt: new Date(Date.now() + 3 * 86_400_000),
      endAt: new Date(Date.now() + 3 * 86_400_000 + 4 * 3_600_000),
      window: 'morning',
    }],
    job: makeJob(),
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.job.update.mockResolvedValue({});
    mockPrisma.rescheduleRequest.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.rescheduleRequest.update.mockImplementation(({ data }: any) => ({ id: 'req-1', ...data }));
    mockPrisma.rescheduleRequest.create.mockImplementation(({ data }: any) => ({ id: 'req-2', ...data }));
    mockPrisma.$transaction.mockImplementation((fn: any) =>
      typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn));
    service = await buildService();
  });

  it('customer picking a staff slot parks at READY_TO_APPLY, not applied', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());

    const res = await service.respond(makeAuthUser(Role.CUSTOMER, 'cust-001'), 'req-1', {
      action: RescheduleResponseAction.PICK, pickedSlotId: 'slot-1',
    });

    expect(res.shouldApply).toBe(false);
    expect(mockPrisma.rescheduleRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'req-1', status: RescheduleStatus.AWAITING_RESPONSE },
      data: expect.objectContaining({ status: RescheduleStatus.SLOT_PICKED, pickedSlotId: 'slot-1' }),
    }));
    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { rescheduleState: RescheduleState.READY_TO_APPLY },
    }));
  });

  it('staff picking a customer slot signals immediate apply', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(
      makeRequest({ openedBy: RescheduleActor.CUSTOMER }));

    const res = await service.respond(makeAuthUser(Role.DISPATCHER), 'req-1', {
      action: RescheduleResponseAction.PICK, pickedSlotId: 'slot-1',
    });

    expect(res.shouldApply).toBe(true);
  });

  it('rejects the side that does not hold the ball', async () => {
    // Staff opened it, so staff cannot also answer it.
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());
    await expect(
      service.respond(makeAuthUser(Role.COMPANY_ADMIN), 'req-1', {
        action: RescheduleResponseAction.PICK, pickedSlotId: 'slot-1',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('conflicts when the round was already superseded', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());
    mockPrisma.rescheduleRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.respond(makeAuthUser(Role.CUSTOMER, 'cust-001'), 'req-1', {
        action: RescheduleResponseAction.PICK, pickedSlotId: 'slot-1',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects picking a slot that belongs to a different request', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());
    await expect(
      service.respond(makeAuthUser(Role.CUSTOMER, 'cust-001'), 'req-1', {
        action: RescheduleResponseAction.PICK, pickedSlotId: 'slot-from-elsewhere',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects picking a slot that has since passed', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest({
      slots: [{
        id: 'slot-old',
        startAt: new Date(Date.now() - 86_400_000),
        endAt: new Date(Date.now() - 82_800_000),
        window: 'morning',
      }],
    }));
    await expect(
      service.respond(makeAuthUser(Role.CUSTOMER, 'cust-001'), 'req-1', {
        action: RescheduleResponseAction.PICK, pickedSlotId: 'slot-old',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('a counter supersedes the old round and flips the ball back', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());

    const res = await service.respond(makeAuthUser(Role.CUSTOMER, 'cust-001'), 'req-1', {
      action: RescheduleResponseAction.COUNTER,
      reasonCode: RescheduleReason.CUSTOMER_UNAVAILABLE,
      slots: [futureSlot()],
      note: 'none of those work',
    });

    expect(mockPrisma.rescheduleRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: RescheduleStatus.SUPERSEDED }),
    }));
    const created = mockPrisma.rescheduleRequest.create.mock.calls[0][0].data;
    expect(created.openedBy).toBe(RescheduleActor.CUSTOMER);
    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { rescheduleState: RescheduleState.AWAITING_ADMIN },
    }));
    expect(res.shouldApply).toBe(false);
  });

  it('an OPEN_ASK is answered with slots via COUNTER', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(
      makeRequest({ openedBy: RescheduleActor.CUSTOMER, mode: RescheduleMode.OPEN_ASK, slots: [] }));

    await service.respond(makeAuthUser(Role.COMPANY_ADMIN), 'req-1', {
      action: RescheduleResponseAction.COUNTER,
      reasonCode: RescheduleReason.TECH_UNAVAILABLE,
      slots: [futureSlot(), futureSlot()],
    });

    const created = mockPrisma.rescheduleRequest.create.mock.calls[0][0].data;
    expect(created.openedBy).toBe(RescheduleActor.ADMIN);
    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { rescheduleState: RescheduleState.AWAITING_CUSTOMER },
    }));
  });

  it('declining closes the negotiation and clears the job flag', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());

    await service.respond(makeAuthUser(Role.CUSTOMER, 'cust-001'), 'req-1', {
      action: RescheduleResponseAction.DECLINE, note: 'never mind',
    });

    expect(mockPrisma.rescheduleRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: RescheduleStatus.DECLINED }),
    }));
    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { rescheduleState: null },
    }));
  });

  it("rejects a customer responding to another customer's request", async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue(makeRequest());
    await expect(
      service.respond(makeAuthUser(Role.CUSTOMER, 'cust-999'), 'req-1', {
        action: RescheduleResponseAction.DECLINE,
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe('RescheduleService queries', () => {
  let service: RescheduleService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((fn: any) =>
      typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn));
    service = await buildService();
  });

  it('cancel closes the request and clears the job flag', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue({
      id: 'req-1', companyId: COMPANY_ID, jobId: JOB_ID,
      openedBy: RescheduleActor.ADMIN, openedByUserId: 'user-001',
      status: RescheduleStatus.AWAITING_RESPONSE, slots: [], job: makeJob(),
    });
    mockPrisma.rescheduleRequest.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.job.update.mockResolvedValue({});

    await service.cancel(makeAuthUser(Role.COMPANY_ADMIN), 'req-1');

    expect(mockPrisma.rescheduleRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: RescheduleStatus.CANCELLED }),
    }));
    expect(mockPrisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { rescheduleState: null },
    }));
  });

  it('cancel refuses when the caller did not open the request', async () => {
    mockPrisma.rescheduleRequest.findFirst.mockResolvedValue({
      id: 'req-1', companyId: COMPANY_ID, jobId: JOB_ID,
      openedBy: RescheduleActor.ADMIN, openedByUserId: 'someone-else',
      status: RescheduleStatus.AWAITING_RESPONSE, slots: [], job: makeJob(),
    });

    // A customer cannot withdraw a request staff opened.
    await expect(
      service.cancel(makeAuthUser(Role.CUSTOMER, 'cust-001'), 'req-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('history returns every round newest-first, scoped to the company', async () => {
    mockPrisma.rescheduleRequest.findMany.mockResolvedValue([]);
    mockPrisma.job.findFirst.mockResolvedValue(makeJob());

    await service.history(makeAuthUser(Role.COMPANY_ADMIN), JOB_ID);

    expect(mockPrisma.rescheduleRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { companyId: COMPANY_ID, jobId: JOB_ID },
      orderBy: { createdAt: 'desc' },
    }));
  });

  it("history refuses another customer's job", async () => {
    mockPrisma.job.findFirst.mockResolvedValue(makeJob());
    await expect(
      service.history(makeAuthUser(Role.CUSTOMER, 'cust-999'), JOB_ID),
    ).rejects.toThrow(ForbiddenException);
  });

  it('inbox marks rounds with no reply for over 5 days as stale', async () => {
    const fresh = new Date();
    const old = new Date(Date.now() - 6 * 86_400_000);
    mockPrisma.rescheduleRequest.findMany.mockResolvedValue([
      { id: 'r1', createdAt: fresh, status: RescheduleStatus.AWAITING_RESPONSE,
        openedBy: RescheduleActor.CUSTOMER, slots: [], job: makeJob() },
      { id: 'r2', createdAt: old, status: RescheduleStatus.SLOT_PICKED,
        openedBy: RescheduleActor.ADMIN, slots: [], job: makeJob() },
    ]);
    mockPrisma.rescheduleRequest.count.mockResolvedValue(2);

    const res = await service.inbox(COMPANY_ID);

    expect(res.data[0].isStale).toBe(false);
    expect(res.data[1].isStale).toBe(true);
  });

  it('inbox excludes staff-opened rounds in the QUERY, not after paginating', async () => {
    // Filtering post-`take` would let a company with a page-full of
    // staff-opened rounds return an empty page 1 while real work sat on page 2,
    // and would report an inflated total. So the exclusion must be in the WHERE.
    mockPrisma.rescheduleRequest.findMany.mockResolvedValue([]);
    mockPrisma.rescheduleRequest.count.mockResolvedValue(0);

    await service.inbox(COMPANY_ID);

    const where = mockPrisma.rescheduleRequest.findMany.mock.calls[0][0].where;
    expect(where.companyId).toBe(COMPANY_ID);
    expect(where.OR).toEqual([
      { status: RescheduleStatus.SLOT_PICKED },
      { status: RescheduleStatus.AWAITING_RESPONSE, openedBy: RescheduleActor.CUSTOMER },
    ]);
    // count() must use the same predicate or totalPages lies
    expect(mockPrisma.rescheduleRequest.count.mock.calls[0][0].where).toEqual(where);
  });

  it('stats groups by reason and by who opened it', async () => {
    mockPrisma.rescheduleRequest.groupBy
      .mockResolvedValueOnce([{ reasonCode: RescheduleReason.PARTS_DELAY, _count: { _all: 4 } }])
      .mockResolvedValueOnce([{ openedBy: RescheduleActor.CUSTOMER, _count: { _all: 3 } }]);
    mockPrisma.rescheduleRequest.count
      .mockResolvedValueOnce(9)   // total
      .mockResolvedValueOnce(5)   // applied
      .mockResolvedValueOnce(1);  // declined

    const res = await service.stats(COMPANY_ID);

    expect(res.byReason[RescheduleReason.PARTS_DELAY]).toBe(4);
    expect(res.byActor[RescheduleActor.CUSTOMER]).toBe(3);
    expect(res.total).toBe(9);
    expect(res.applied).toBe(5);
    expect(res.declined).toBe(1);
  });
});
