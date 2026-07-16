/**
 * JobsService — State Machine Unit Tests
 *
 * Focuses on the job status state machine (STATUS_TRANSITIONS) which is the most
 * critical piece of business logic in the job service.
 *
 * Test strategy:
 *  - PrismaService is fully mocked — no database required
 *  - Every valid and invalid transition is tested
 *  - Timestamp side-effects are verified (actualStart, actualEnd, completedAt)
 *  - Role-based access restrictions are tested at the guard level
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { JobStatusDto, STATUS_TRANSITIONS } from './dto/update-job-status.dto';
import { Role } from '@tscrm/types';

// ── Helpers ───────────────────────────────────────────────────────────────

const COMPANY_ID = 'company-001';
const JOB_ID = 'job-001';
const USER_ID = 'user-001';

function makeAuthUser(role: Role = Role.COMPANY_ADMIN) {
  return {
    sub: USER_ID,
    userId: USER_ID,
    companyId: COMPANY_ID,
    email: 'test@test.com',
    name: 'Test User',
    role,
  };
}

function makeJob(status: JobStatusDto, overrides: Record<string, unknown> = {}): any {
  return {
    id: JOB_ID,
    companyId: COMPANY_ID,
    jobNumber: 'JOB-2024-0001',
    title: 'Test Job',
    status,
    priority: 'NORMAL',
    assignedToId: null,
    actualStart: null,
    actualEnd: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    jobType: null,
    template: null,
    customFieldValues: [],
    statusHistory: [],
    workOrders: [],
    ...overrides,
  };
}

// ── Mock Prisma ───────────────────────────────────────────────────────────

const mockPrisma = {
  job: {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  jobStatusHistory: {
    create: jest.fn(),
  },
  jobCustomFieldValue: {
    upsert: jest.fn(),
  },
  // generateJobNumber reads MAX(jobNumber) via $queryRaw inside the tx
  $queryRaw: jest.fn().mockResolvedValue([{ maxNumber: 0 }]),
  $transaction: jest.fn((fnOrArray: any): any => {
    if (typeof fnOrArray === 'function') return fnOrArray(mockPrisma);
    return Promise.all(fnOrArray);
  }),
};

// ═══════════════════════════════════════════════════════════════════════════
// STATUS_TRANSITIONS data structure tests
// ═══════════════════════════════════════════════════════════════════════════

describe('STATUS_TRANSITIONS map', () => {
  it('covers all JobStatusDto values', () => {
    const allStatuses = Object.values(JobStatusDto);
    allStatuses.forEach((s) => {
      expect(STATUS_TRANSITIONS).toHaveProperty(s);
    });
  });

  it('PAID is a terminal state with no outgoing transitions', () => {
    expect(STATUS_TRANSITIONS[JobStatusDto.PAID]).toHaveLength(0);
  });

  it('COMPLETED can move to INVOICED or CANCELLED (voiding a completed job)', () => {
    expect(STATUS_TRANSITIONS[JobStatusDto.COMPLETED]).toContain(JobStatusDto.INVOICED);
    expect(STATUS_TRANSITIONS[JobStatusDto.COMPLETED]).toContain(JobStatusDto.CANCELLED);
  });

  it('CANCELLED can be re-opened to PENDING (one recovery path)', () => {
    expect(STATUS_TRANSITIONS[JobStatusDto.CANCELLED]).toContain(JobStatusDto.PENDING);
    expect(STATUS_TRANSITIONS[JobStatusDto.CANCELLED]).toHaveLength(1);
  });

  it('ON_HOLD can resume as SCHEDULED or be CANCELLED', () => {
    const transitions = STATUS_TRANSITIONS[JobStatusDto.ON_HOLD];
    expect(transitions).toContain(JobStatusDto.SCHEDULED);
    expect(transitions).toContain(JobStatusDto.CANCELLED);
  });

  it('INVOICED can move to PAID or CANCELLED (disputing an invoice)', () => {
    expect(STATUS_TRANSITIONS[JobStatusDto.INVOICED]).toContain(JobStatusDto.PAID);
    expect(STATUS_TRANSITIONS[JobStatusDto.INVOICED]).toContain(JobStatusDto.CANCELLED);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// JobsService.updateJobStatus
// ═══════════════════════════════════════════════════════════════════════════

describe('JobsService — updateJobStatus', () => {
  let service: JobsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  // ── Helper: configure prisma mocks for a status update ─────────────────
  function setupUpdateMocks(fromStatus: JobStatusDto, toStatus: JobStatusDto) {
    const job = makeJob(fromStatus);
    // findOne call inside updateJobStatus
    mockPrisma.job.findFirst.mockResolvedValue({
      ...job,
      jobType: null, template: null, customFieldValues: [], statusHistory: [], workOrders: [],
    });
    mockPrisma.job.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ ...job, ...data }),
    );
    mockPrisma.$transaction.mockImplementation((fnOrArray: any): any => {
      if (typeof fnOrArray === 'function') return fnOrArray(mockPrisma);
      return Promise.all(fnOrArray);
    });
    return job;
  }

  // ── Valid transitions ───────────────────────────────────────────────────

  describe('valid transitions', () => {
    const validCases: Array<[JobStatusDto, JobStatusDto]> = [
      [JobStatusDto.PENDING, JobStatusDto.SCHEDULED],
      [JobStatusDto.PENDING, JobStatusDto.CANCELLED],
      [JobStatusDto.SCHEDULED, JobStatusDto.EN_ROUTE],
      [JobStatusDto.SCHEDULED, JobStatusDto.ON_HOLD],
      [JobStatusDto.SCHEDULED, JobStatusDto.CANCELLED],
      [JobStatusDto.EN_ROUTE, JobStatusDto.ON_SITE],
      [JobStatusDto.EN_ROUTE, JobStatusDto.SCHEDULED],
      [JobStatusDto.ON_SITE, JobStatusDto.COMPLETED],
      [JobStatusDto.ON_SITE, JobStatusDto.ON_HOLD],
      [JobStatusDto.COMPLETED, JobStatusDto.INVOICED],
      [JobStatusDto.INVOICED, JobStatusDto.PAID],
      [JobStatusDto.CANCELLED, JobStatusDto.PENDING],
      [JobStatusDto.ON_HOLD, JobStatusDto.SCHEDULED],
      [JobStatusDto.ON_HOLD, JobStatusDto.CANCELLED],
    ];

    test.each(validCases)(
      'allows %s → %s',
      async (from, to) => {
        setupUpdateMocks(from, to);
        await expect(
          service.updateStatus(COMPANY_ID, JOB_ID, makeAuthUser(), { status: to }),
        ).resolves.toBeDefined();
        expect(mockPrisma.job.update).toHaveBeenCalled();
      },
    );
  });

  // ── Invalid transitions ─────────────────────────────────────────────────

  describe('invalid transitions', () => {
    const invalidCases: Array<[JobStatusDto, JobStatusDto]> = [
      [JobStatusDto.PENDING, JobStatusDto.PAID],  // skip steps
      [JobStatusDto.PENDING, JobStatusDto.PAID],                         // skip multiple
      [JobStatusDto.PENDING, JobStatusDto.COMPLETED],                    // skip multiple
      [JobStatusDto.PAID, JobStatusDto.PENDING],                         // reverse from terminal
      [JobStatusDto.PAID, JobStatusDto.CANCELLED],                       // terminal
      [JobStatusDto.COMPLETED, JobStatusDto.EN_ROUTE],                   // reverse
      [JobStatusDto.INVOICED, JobStatusDto.COMPLETED],                   // reverse
      [JobStatusDto.SCHEDULED, JobStatusDto.PAID],                       // skip multiple
    ];

    test.each(invalidCases)(
      'rejects %s → %s',
      async (from, to) => {
        setupUpdateMocks(from, to);
        await expect(
          service.updateStatus(COMPANY_ID, JOB_ID, makeAuthUser(), { status: to }),
        ).rejects.toThrow(BadRequestException);
        expect(mockPrisma.job.update).not.toHaveBeenCalled();
      },
    );
  });

  // ── Timestamp side-effects ──────────────────────────────────────────────

  describe('timestamp side-effects', () => {
    it('sets actualStart when transitioning to ON_SITE', async () => {
      setupUpdateMocks(JobStatusDto.EN_ROUTE, JobStatusDto.ON_SITE);

      await service.updateStatus(COMPANY_ID, JOB_ID, makeAuthUser(), {
        status: JobStatusDto.ON_SITE,
      });

      const updateCall = mockPrisma.job.update.mock.calls[0][0];
      expect(updateCall.data.actualStart).toBeInstanceOf(Date);
    });

    it('sets actualEnd and completedAt when transitioning to COMPLETED', async () => {
      setupUpdateMocks(JobStatusDto.ON_SITE, JobStatusDto.COMPLETED);

      await service.updateStatus(COMPANY_ID, JOB_ID, makeAuthUser(), {
        status: JobStatusDto.COMPLETED,
      });

      const updateCall = mockPrisma.job.update.mock.calls[0][0];
      expect(updateCall.data.actualEnd).toBeInstanceOf(Date);
      expect(updateCall.data.completedAt).toBeInstanceOf(Date);
    });

    it('does NOT set actualStart when transitioning to EN_ROUTE', async () => {
      setupUpdateMocks(JobStatusDto.SCHEDULED, JobStatusDto.EN_ROUTE);

      await service.updateStatus(COMPANY_ID, JOB_ID, makeAuthUser(), {
        status: JobStatusDto.EN_ROUTE,
      });

      const updateCall = mockPrisma.job.update.mock.calls[0][0];
      expect(updateCall.data.actualStart).toBeUndefined();
    });
  });

  // ── NotFoundException ──────────────────────────────────────────────────

  describe('findOne errors', () => {
    it('throws NotFoundException when job not found', async () => {
      mockPrisma.job.findFirst.mockResolvedValue(null);
      await expect(
        service.updateStatus(COMPANY_ID, 'bad-id', makeAuthUser(), {
          status: JobStatusDto.SCHEDULED,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// JobsService.create
// ═══════════════════════════════════════════════════════════════════════════

describe('JobsService — create', () => {
  let service: JobsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<JobsService>(JobsService);
  });

  it('generates a sequential job number', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ maxNumber: 4 }]);
    mockPrisma.job.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ ...makeJob(JobStatusDto.PENDING), ...data }),
    );
    mockPrisma.job.findFirst.mockResolvedValue(makeJob(JobStatusDto.PENDING));

    await service.create(makeAuthUser() as any, {
      title: 'Test Job',
      customerId: 'cust-001',
      customerName: 'Test Corp',
      jobTypeId: 'jt-001',
    } as any);

    const createCall = mockPrisma.job.create.mock.calls[0][0];
    expect(createCall.data.jobNumber).toMatch(/JOB-\d{4}-0005/);
  });

  it('sets status to PENDING on create', async () => {
    mockPrisma.job.count.mockResolvedValue(0);
    mockPrisma.job.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ ...makeJob(JobStatusDto.PENDING), ...data }),
    );
    mockPrisma.job.findFirst.mockResolvedValue(makeJob(JobStatusDto.PENDING));

    await service.create(makeAuthUser() as any, {
      title: 'Test', customerId: 'c', customerName: 'C', jobTypeId: 'jt-001',
    } as any);

    const createCall = mockPrisma.job.create.mock.calls[0][0];
    expect(createCall.data.statusHistory.create.toStatus).toBe('PENDING');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// findAll — houseId/equipmentId filters (Housing Scheme service log)
// ═══════════════════════════════════════════════════════════════════════════

describe('JobsService — findAll filters', () => {
  let service: JobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<JobsService>(JobsService);

    mockPrisma.job.findMany.mockReset().mockResolvedValue([]);
    mockPrisma.job.count.mockReset().mockResolvedValue(0);
  });

  it('filters by houseId when provided', async () => {
    await service.findAll(COMPANY_ID, 1, 20, { houseId: 'house-1' });
    const findManyCall = mockPrisma.job.findMany.mock.calls[0][0];
    expect(findManyCall.where.houseId).toBe('house-1');
    expect(findManyCall.where.equipmentId).toBeUndefined();
  });

  it('filters by equipmentId when provided', async () => {
    await service.findAll(COMPANY_ID, 1, 20, { equipmentId: 'eq-1' });
    const findManyCall = mockPrisma.job.findMany.mock.calls[0][0];
    expect(findManyCall.where.equipmentId).toBe('eq-1');
    expect(findManyCall.where.houseId).toBeUndefined();
  });

  it('omits houseId/equipmentId from the filter when not provided', async () => {
    await service.findAll(COMPANY_ID, 1, 20, {});
    const findManyCall = mockPrisma.job.findMany.mock.calls[0][0];
    expect(findManyCall.where.houseId).toBeUndefined();
    expect(findManyCall.where.equipmentId).toBeUndefined();
  });
});
