import { WinbackService } from './winback.service';
import { WinbackCandidate } from '../automation/crm.client';

function makeCandidate(overrides: Partial<WinbackCandidate> = {}): WinbackCandidate {
  const sixMonthsAgo = new Date(Date.now() - 200 * 86_400_000).toISOString();
  return {
    id: 'cust-1',
    companyId: 'co-1',
    firstName: 'Bob',
    lastName: 'Jones',
    email: 'bob@example.com',
    phone: '+15559876543',
    mobile: null,
    zipCode: '30301',
    state: 'GA',
    updatedAt: sixMonthsAgo,
    bookings: [{ preferredDate: sixMonthsAgo }],
    agreements: [{ value: 150, endDate: null }],
    ...overrides,
  };
}

function makeService() {
  const db = {
    sendJob: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'sj-1' }),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const suppression = { isSuppressed: jest.fn().mockResolvedValue(false) };
  const sms = { send: jest.fn().mockResolvedValue({ success: true }) };
  const crmClient = { getWinbackCandidates: jest.fn(), getActiveCompanyIds: jest.fn() };
  const churnGate = { scoreAndGate: jest.fn() };
  const queue = { add: jest.fn().mockResolvedValue({}) };

  const service = new WinbackService(
    db as any, suppression as any, sms as any, crmClient as any, churnGate as any, queue as any,
  );
  return { service, db, suppression, sms, crmClient, churnGate, queue };
}

describe('WinbackService', () => {
  it('skips candidate when churn score is below threshold (< 0.7)', async () => {
    const { service, churnGate, sms, queue } = makeService();
    (churnGate.scoreAndGate as jest.Mock).mockResolvedValueOnce({ score: 0.4, passed: true });

    const result = await service.evaluateCandidate(makeCandidate());
    expect(result).toBeNull();
    expect(sms.send).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('triggers all 3 steps when churn score >= 0.7 and not suppressed', async () => {
    const { service, churnGate, sms, suppression, queue } = makeService();
    (churnGate.scoreAndGate as jest.Mock).mockResolvedValueOnce({ score: 0.82, passed: false });
    (suppression.isSuppressed as jest.Mock).mockResolvedValue(false);

    const result = await service.evaluateCandidate(makeCandidate());
    expect(result).not.toBeNull();
    expect(result!.step1SmsSent).toBe(true);
    expect(result!.step2Queued).toBe(true);
    expect(result!.step3Queued).toBe(true);
    expect(sms.send).toHaveBeenCalledWith('+15559876543', expect.stringContaining('Bob'), expect.any(String));
    expect(queue.add).toHaveBeenCalledWith('winback-email', expect.objectContaining({ to: 'bob@example.com' }), expect.any(Object));
    expect(queue.add).toHaveBeenCalledWith('winback-sms', expect.objectContaining({ phone: '+15559876543' }), expect.any(Object));
  });

  it('skips candidate when recently sent within cooldown (90 days)', async () => {
    const { service, db, sms } = makeService();
    db.sendJob.count.mockResolvedValueOnce(1); // cooldown hit

    const result = await service.evaluateCandidate(makeCandidate());
    expect(result).toBeNull();
    expect(sms.send).not.toHaveBeenCalled();
  });

  it('skips step1 SMS when phone is suppressed', async () => {
    const { service, churnGate, suppression, sms, queue } = makeService();
    (churnGate.scoreAndGate as jest.Mock).mockResolvedValueOnce({ score: 0.9, passed: false });
    (suppression.isSuppressed as jest.Mock)
      .mockResolvedValueOnce(true)   // step1 SMS suppressed
      .mockResolvedValueOnce(false)  // step2 email not suppressed
      .mockResolvedValueOnce(true);  // step3 SMS suppressed

    const result = await service.evaluateCandidate(makeCandidate());
    expect(result!.step1SmsSent).toBe(false);
    expect(result!.step2Queued).toBe(true);
    expect(result!.step3Queued).toBe(false);
    expect(sms.send).not.toHaveBeenCalled();
  });

  it('marks result as skipped when all channels are suppressed', async () => {
    const { service, churnGate, suppression } = makeService();
    (churnGate.scoreAndGate as jest.Mock).mockResolvedValueOnce({ score: 0.9, passed: false });
    (suppression.isSuppressed as jest.Mock).mockResolvedValue(true);

    const result = await service.evaluateCandidate(makeCandidate());
    expect(result!.skipped).toBe(true);
    expect(result!.reason).toBe('all_channels_suppressed');
  });

  it('defaults to a high churn score when the gate returns no score (score = -1)', async () => {
    const { service, churnGate, sms } = makeService();
    // score = -1 is the "unknown score" sentinel; service defaults to 0.8 > threshold
    (churnGate.scoreAndGate as jest.Mock).mockResolvedValueOnce({ score: -1, passed: true });

    const result = await service.evaluateCandidate(makeCandidate());
    expect(result).not.toBeNull();
    expect(result!.churnScore).toBe(0.8);
    expect(sms.send).toHaveBeenCalled();
  });

  it('step2 and step3 are queued with correct delays', async () => {
    const { service, churnGate, suppression, queue } = makeService();
    (churnGate.scoreAndGate as jest.Mock).mockResolvedValueOnce({ score: 0.75, passed: false });
    (suppression.isSuppressed as jest.Mock).mockResolvedValue(false);

    await service.evaluateCandidate(makeCandidate());

    const emailCall = (queue.add as jest.Mock).mock.calls.find((c: any) => c[0] === 'winback-email');
    const smsCall = (queue.add as jest.Mock).mock.calls.find((c: any) => c[0] === 'winback-sms');

    // 3 days in ms
    expect(emailCall[2].delay).toBe(3 * 24 * 60 * 60 * 1000);
    // 7 days in ms
    expect(smsCall[2].delay).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('records 3 SendJob rows (step1 SMS, step2 email, step3 SMS)', async () => {
    const { service, churnGate, suppression, db } = makeService();
    (churnGate.scoreAndGate as jest.Mock).mockResolvedValueOnce({ score: 0.8, passed: false });
    (suppression.isSuppressed as jest.Mock).mockResolvedValue(false);

    await service.evaluateCandidate(makeCandidate());
    expect(db.sendJob.create).toHaveBeenCalledTimes(3);

    const templates = (db.sendJob.create as jest.Mock).mock.calls.map((c: any) => c[0].data.automationTemplate);
    expect(templates).toContain('winback-step1');
    expect(templates).toContain('winback-step2');
    expect(templates).toContain('winback-step3');
  });
});
