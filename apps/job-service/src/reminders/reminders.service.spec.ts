import { RemindersService } from './reminders.service';

describe('RemindersService.sweep', () => {
  const mockPrisma: any = { job: { findMany: jest.fn() } };
  const post = jest.fn().mockResolvedValue({ data: { sent: true } });
  const http: any = { post };
  let service: RemindersService;

  beforeEach(() => {
    jest.clearAllMocks();
    post.mockResolvedValue({ data: { sent: true } });
    service = new RemindersService(mockPrisma, http);
  });

  it('sends one reminder per upcoming job, keyed for idempotency', async () => {
    mockPrisma.job.findMany.mockResolvedValue([
      {
        id: 'job-1', companyId: 'co-1', customerId: 'cust-1',
        title: 'AC service', scheduledStart: new Date('2026-08-20T09:00:00Z'),
      },
    ]);

    const result = await service.sweep();

    expect(result).toEqual({ scanned: 1, sent: 1 });
    expect(post).toHaveBeenCalledWith(
      expect.stringContaining('/notifications/customer-push'),
      expect.objectContaining({
        companyId: 'co-1',
        customerId: 'cust-1',
        dedupeKey: 'job-reminder:job-1:2026-08-20',
        data: { type: 'job_reminder', jobId: 'job-1' },
      }),
      expect.anything(),
    );
  });

  it('skips jobs with no customerId rather than sending an unaddressed push', async () => {
    mockPrisma.job.findMany.mockResolvedValue([
      { id: 'job-2', companyId: 'co-1', customerId: null, title: 'X', scheduledStart: new Date() },
    ]);

    const result = await service.sweep();

    expect(result).toEqual({ scanned: 1, sent: 0 });
    expect(post).not.toHaveBeenCalled();
  });

  it('keeps sweeping when one push call fails', async () => {
    mockPrisma.job.findMany.mockResolvedValue([
      { id: 'job-1', companyId: 'co-1', customerId: 'c1', title: 'A', scheduledStart: new Date('2026-08-20T09:00:00Z') },
      { id: 'job-3', companyId: 'co-1', customerId: 'c2', title: 'B', scheduledStart: new Date('2026-08-20T11:00:00Z') },
    ]);
    post.mockRejectedValueOnce(new Error('comms down'));

    const result = await service.sweep();

    expect(result.scanned).toBe(2);
    expect(result.sent).toBe(1);
  });

  it('only looks at SCHEDULED jobs inside the lookahead window', async () => {
    mockPrisma.job.findMany.mockResolvedValue([]);

    await service.sweep();

    const where = mockPrisma.job.findMany.mock.calls[0][0].where;
    expect(where.status).toBe('SCHEDULED');
    expect(where.scheduledStart.gte).toBeInstanceOf(Date);
    expect(where.scheduledStart.lte).toBeInstanceOf(Date);
    expect(where.scheduledStart.lte.getTime()).toBeGreaterThan(where.scheduledStart.gte.getTime());
  });
});
