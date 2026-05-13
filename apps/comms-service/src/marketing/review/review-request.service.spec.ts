import { ConflictException } from '@nestjs/common';
import { ReviewRequestService } from './review-request.service';
import { ChurnGateService } from './churn-gate.service';
import { SuppressionService } from '../suppression/suppression.service';
import { TriggerReviewRequestDto } from './review-request.dto';

const makeDb = () => ({
  reviewRequest: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
});

const makeSms = () => ({ send: jest.fn() });
const makeEmail = () => ({ send: jest.fn() });
const makeSuppression = (): Pick<SuppressionService, 'isSuppressed'> => ({ isSuppressed: jest.fn() });
const makeChurnGate = (): Pick<ChurnGateService, 'scoreAndGate'> => ({ scoreAndGate: jest.fn() });
const makeQueue = () => ({ add: jest.fn() });

function makeService() {
  const db = makeDb();
  const sms = makeSms();
  const email = makeEmail();
  const suppression = makeSuppression();
  const churnGate = makeChurnGate();
  const queue = makeQueue();

  const service = new ReviewRequestService(
    db as any,
    suppression as any,
    churnGate as any,
    sms as any,
    email as any,
    queue as any,
  );
  return { service, db, sms, email, suppression, churnGate, queue };
}

const baseDto: TriggerReviewRequestDto = {
  companyId: 'co-1',
  customerId: 'cust-1',
  jobId: 'job-1',
  customerName: 'Alice',
  customerPhone: '+15551234567',
  customerEmail: 'alice@example.com',
  daysSinceLastService: 30,
  serviceCountLastYear: 2,
  avgMonthlySpend: 150,
  customerTenureDays: 365,
};

describe('ReviewRequestService', () => {
  it('throws ConflictException when review request already exists for job', async () => {
    const { service, db } = makeService();
    db.reviewRequest.findUnique.mockResolvedValueOnce({ id: 'existing' });
    await expect(service.trigger(baseDto)).rejects.toThrow(ConflictException);
  });

  it('creates EXPIRED record when Smart Gate blocks high-churn customer', async () => {
    const { service, db, churnGate } = makeService();
    db.reviewRequest.findUnique.mockResolvedValueOnce(null);
    (churnGate.scoreAndGate as jest.Mock).mockResolvedValueOnce({ score: 0.85, passed: false });
    db.reviewRequest.create.mockResolvedValueOnce({ id: 'rr-1', status: 'EXPIRED' });

    const result = await service.trigger(baseDto);

    expect(result.gatePassed).toBe(false);
    expect(result.status).toBe('EXPIRED');
    expect(result.smsSent).toBe(false);
    expect(result.emailQueued).toBe(false);
    expect(db.reviewRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'EXPIRED' }) }),
    );
  });

  it('sends SMS and queues email when gate passes and customer not suppressed', async () => {
    const { service, db, sms, suppression, churnGate, queue } = makeService();
    db.reviewRequest.findUnique.mockResolvedValueOnce(null);
    (churnGate.scoreAndGate as jest.Mock).mockResolvedValueOnce({ score: 0.2, passed: true });
    db.reviewRequest.create.mockResolvedValueOnce({ id: 'rr-2', status: 'PENDING' });
    (suppression.isSuppressed as jest.Mock).mockResolvedValue(false);
    (sms.send as jest.Mock).mockResolvedValueOnce(undefined);
    db.reviewRequest.update.mockResolvedValueOnce({});
    queue.add.mockResolvedValueOnce({});

    const result = await service.trigger(baseDto);

    expect(result.smsSent).toBe(true);
    expect(result.emailQueued).toBe(true);
    expect(sms.send).toHaveBeenCalledWith('+15551234567', expect.stringContaining('Alice'));
    expect(queue.add).toHaveBeenCalledWith('review-email', expect.objectContaining({ reviewRequestId: 'rr-2' }), expect.any(Object));
  });

  it('skips SMS when customer phone is suppressed', async () => {
    const { service, db, sms, suppression, churnGate, queue } = makeService();
    db.reviewRequest.findUnique.mockResolvedValueOnce(null);
    (churnGate.scoreAndGate as jest.Mock).mockResolvedValueOnce({ score: 0.1, passed: true });
    db.reviewRequest.create.mockResolvedValueOnce({ id: 'rr-3', status: 'PENDING' });
    (suppression.isSuppressed as jest.Mock)
      .mockResolvedValueOnce(true)  // SMS suppressed
      .mockResolvedValueOnce(false); // EMAIL not suppressed
    queue.add.mockResolvedValueOnce({});

    const result = await service.trigger(baseDto);

    expect(result.smsSent).toBe(false);
    expect(result.emailQueued).toBe(true);
    expect(sms.send).not.toHaveBeenCalled();
  });

  it('skips email queue when both channels are suppressed', async () => {
    const { service, db, suppression, churnGate, queue } = makeService();
    db.reviewRequest.findUnique.mockResolvedValueOnce(null);
    (churnGate.scoreAndGate as jest.Mock).mockResolvedValueOnce({ score: 0.1, passed: true });
    db.reviewRequest.create.mockResolvedValueOnce({ id: 'rr-4', status: 'PENDING' });
    (suppression.isSuppressed as jest.Mock).mockResolvedValue(true);

    const result = await service.trigger(baseDto);

    expect(result.smsSent).toBe(false);
    expect(result.emailQueued).toBe(false);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('still queues email when SMS fails', async () => {
    const { service, db, sms, suppression, churnGate, queue } = makeService();
    db.reviewRequest.findUnique.mockResolvedValueOnce(null);
    (churnGate.scoreAndGate as jest.Mock).mockResolvedValueOnce({ score: 0.3, passed: true });
    db.reviewRequest.create.mockResolvedValueOnce({ id: 'rr-5', status: 'PENDING' });
    (suppression.isSuppressed as jest.Mock).mockResolvedValue(false);
    (sms.send as jest.Mock).mockRejectedValueOnce(new Error('Twilio error'));
    queue.add.mockResolvedValueOnce({});

    const result = await service.trigger(baseDto);

    expect(result.smsSent).toBe(false);
    expect(result.emailQueued).toBe(true);
  });

  it('skips gate check when no churn inputs provided', async () => {
    const { service, db, sms, suppression, churnGate, queue } = makeService();
    db.reviewRequest.findUnique.mockResolvedValueOnce(null);
    db.reviewRequest.create.mockResolvedValueOnce({ id: 'rr-6', status: 'PENDING' });
    (suppression.isSuppressed as jest.Mock).mockResolvedValue(false);
    (sms.send as jest.Mock).mockResolvedValueOnce(undefined);
    db.reviewRequest.update.mockResolvedValueOnce({});
    queue.add.mockResolvedValueOnce({});

    const dto = { ...baseDto, daysSinceLastService: undefined };
    const result = await service.trigger(dto);

    expect(churnGate.scoreAndGate).not.toHaveBeenCalled();
    expect(result.gatePassed).toBe(true);
  });
});
